---
authors: [daeyeon]
---
# Node.js 빌드와 검증

Node.js 코어를 고치다 보면 빌드와 테스트를 여러 번 반복하게 됩니다. 여기서는 개발 중 자주 쓰는 빌드, 상황별 설정 옵션, 테스트, lint 명령를 다룹니다.

## JavaScript 변경 흐름

저장소 루트에서 `--node-builtin-modules-path`를 지정해 한 번 configure하고 빌드하면 `lib/`의 JavaScript를
작업 트리에서 직접 읽습니다. 이후 기존 JavaScript 파일을 고치는 동안에는 다시 빌드하지 않고 바로
테스트할 수 있습니다.

```bash
# 처음 한 번 준비
./configure --node-builtin-modules-path "$(pwd)"
make -j4

# JavaScript를 고치며 반복
$EDITOR lib/internal/process/pre_execution.js
./node test/parallel/test-my-changes.js
tools/test.py test/parallel/test-my-changes.js
make lint-js-fix
make lint-js
```

일반 설정으로 빌드했다면 JavaScript가 바이너리에 포함되므로, JavaScript를 고친 뒤 `make -j4`를 먼저
실행합니다.

## C++ 변경 흐름

C++ 변경은 컴파일과 링크가 필요합니다. configure 옵션을 바꾸지 않았다면 `./configure`를 다시
실행하지 않고 `make`부터 반복합니다.

```bash
# 처음 한 번 준비
./configure
make -j4

# C++를 고치며 반복
$EDITOR src/node_options.cc
make -j4
./node test/parallel/test-my-changes.js
tools/test.py test/parallel/test-my-changes.js
make format-cpp
make lint-cpp
```

빠른 반복을 위해 개발용 설정을 썼더라도 마지막에는 기본 설정으로 다시 빌드해 JavaScript를 바이너리에
포함하고 전체 테스트를 실행하는 편이 좋습니다. 변경이 예상보다 넓게 영향을 미쳐 bootstrap, code cache 생성,
Worker 환경 등에서 문제가 드러날 수 있기 때문입니다.

```bash
# 개발용 설정을 썼다면 기본 설정으로 다시 빌드
./configure
make -j4

tools/test.py parallel
make test
git add -A && git commit -s
npx core-validate-commit --no-validate-metadata HEAD
```

## Configure와 빌드

`./configure`는 빌드할 때마다 실행하지 않습니다. 빌드 옵션을 `config.gypi`에 기록하고,
Makefile 또는 Ninja 빌드 파일을 만드는 단계입니다. 이후에는 생성된 빌드 파일을 사용하는
`make`를 반복합니다.

```text
./configure -> config.gypi -> Makefile / build.ninja -> make
```

빌드한 Node.js의 `process.config`에는 `config.gypi`의 설정이 반영됩니다.

```bash
./node -e 'console.log(process.config)' # config.gypi
```

### configure 옵션 고르기

`./configure`에는 여러 빌드 옵션이 있습니다. 현재 소스 트리에서 쓸 수 있는 옵션은
`./configure --help`로 확인합니다. 모든 옵션을 외우기보다 해결하려는 문제를 기준으로 고릅니다.

#### C++ 코드 분석 설정하기

VS Code나 clangd에서 C++ 코드를 정확히 분석하려면 `-C`로 compilation database를 만듭니다. 각 파일의
컴파일러 옵션, 헤더 검색 경로, 전처리 define이 `compile_commands.json`에 기록됩니다.

```bash
./configure -C
```

Release 설정에서는 `out/Release/compile_commands.json`을 만들고 저장소 루트에서도 `compile_commands.json`으로 읽을 수 있게 합니다. (-C는 `--help` 시 표시되지 않습니다.)

#### 오류와 메모리 문제 찾기

C++의 out-of-bounds access, use-after-free, double free, 메모리 누수처럼 실행 중에 발생하는 메모리 오류는
AddressSanitizer 빌드로 찾습니다. `--enable-asan`은 검사 코드를 바이너리에 넣을 뿐이므로, 빌드 후 문제를
재현하는 테스트나 작업을 실행해야 합니다. Node.js의 ASan 빌드는 GNU/Linux에서 지원됩니다.

`--enable-ubsan`은 signed integer overflow, 잘못된 shift나 alignment 같은 undefined behavior를 실행 중에
찾습니다. 컴파일러 경고도 새로 생기지 않게 확인하려면 `--error-on-warn`을 함께 고려합니다.

```bash
./configure --enable-asan --enable-ubsan
make -j4
./node test/parallel/test-my-changes.js
```

두 sanitizer는 함께 켤 수 있습니다. 오류를 분리해서 보거나 실행 부담을 줄여야 한다면 하나씩 사용합니다.
`--debug`는 필수는 아니지만 sanitizer가 문제를 찾았을 때 스택을 읽기 쉽게 합니다. 대신 빌드와 테스트가
느려집니다.

#### V8 heap 조건을 바꿔 재현하기

sanitizer는 네이티브 메모리 오류를 찾습니다. V8 런타임 옵션은 JavaScript heap의 크기와 GC 조건을 바꿔
문제를 재현하고 관찰합니다. 이 옵션은 다시 빌드하지 않고 `./node`를 실행할 때 지정하는 편이
빠릅니다.

##### V8 heap과 GC

V8 heap은 JavaScript 객체가 놓이는 메모리입니다. Buffer나 C++ 할당까지 포함한 전체 프로세스
메모리와는 다릅니다.

> **heap 영역**
>
> - **young generation**: 새 객체가 먼저 놓이는 영역
> - **semi-space**: 살아남은 객체를 옮겨가며 수집하는 young generation 내부 영역
> - **old space**: 여러 GC에서 살아남은 객체가 이동하는 영역
>
> **GC 종류**
>
> - **minor GC**: young generation을 수집하며, 대표적으로 `Scavenge`가 있습니다.
> - **major GC**: old space까지 수집하며, `Mark-sweep`, `Mark-Compact` 등이 있습니다.

major GC 뒤에도 old space 사용량이 거의 줄지 않고 계속 증가한다면, 객체가 계속 참조되고 있거나 메모리
누수가 있는지 조사합니다. `--trace-gc` 출력의 숫자와 GC 종류를 읽는 방법은 Node.js의
[Tracing garbage collection](https://nodejs.org/learn/diagnostics/memory/using-gc-traces)에 설명되어 있습니다.

##### 메모리 테스트에 쓰는 런타임 옵션

- `--max-old-space-size=SIZE`는 old space를 작게 제한해 메모리 누수를 더 빨리 메모리 부족(OOM)으로
  드러냅니다.
- `--max-semi-space-size=SIZE`는 semi-space 크기를 바꿔 minor GC 발생 빈도를 조절합니다.
- `--expose-gc`는 테스트에서 참조를 끊은 뒤 `global.gc()`를 호출해 GC 시점을 직접 만듭니다. `WeakRef`나
  네이티브 자원이 정리되는지 확인하는 테스트에 사용합니다.
- 메모리 증가나 지연이 GC 때문인지 먼저 확인할 때 `--trace-gc`를 사용합니다. GC 후 메모리가 충분히
  줄면 할당이 많은 작업이고, major GC 뒤에도 계속 남으면 메모리 누수를 의심할 수 있습니다.
- 어떤 실행 경로에서 메모리를 많이 할당하는지 찾을 때 `--heap-prof`로 할당 프로파일을 남깁니다.
- OOM 직전에 어떤 객체가 heap을 점유하는지 보려면 `--heapsnapshot-near-heap-limit=N`으로 스냅샷을
  남깁니다. 스냅샷 생성은 느리고 메모리도 더 사용하므로 종료되어도 괜찮은 테스트 프로세스에서 사용합니다.

자세한 사용법은 Node.js의 [Heap Profiler](https://nodejs.org/learn/diagnostics/memory/using-heap-profiler)와
[Heap Snapshot](https://nodejs.org/learn/diagnostics/memory/using-heap-snapshot) 가이드에 있습니다.

```bash
./node \
  --max-old-space-size=256 \
  --max-semi-space-size=16 \
  --trace-gc \
  test/parallel/test-my-memory-case.js

./node --expose-gc test/parallel/test-my-memory-case.js
```

##### 코어 회귀 테스트 예시

메모리 회귀 테스트에서는 옵션마다 만들려는 조건이 다릅니다.

- 메모리 누수를 빠르게 OOM으로 드러내기.
[`test/parallel/test-promise-race-memory-leak.js`](https://github.com/nodejs/node/blob/main/test/parallel/test-promise-race-memory-leak.js)는
old space를 64 MiB로 제한합니다. 누수가 남아 있으면 테스트가 끝나기 전에 OOM으로 비정상 종료됩니다.

```js
// Flags: --max-old-space-size=64
```

- `WeakRef` 정리 확인하기.
[`test/parallel/test-weakref.js`](https://github.com/nodejs/node/blob/main/test/parallel/test-weakref.js)는
`--expose-gc`를 선언하고 `global.gc()`를 호출한 뒤 `WeakRef`가 비워졌는지 확인합니다. GC 시점을 직접
만드는 가장 단순한 예입니다.

```js
// Flags: --expose-gc
global.gc();
```

#### 반복 빌드 가볍게 만들기

빌드 결과를 일부 바꿔 반복 시간을 줄일 수 있습니다. `--without-node-snapshot`,
`--without-node-code-cache`는 시작할 때 쓰는 산출물 생성을 끕니다. `--without-npm`은 npm을 함께 넣지
않아도 되는 코어 개발 빌드에서 설치 대상을 줄입니다.

```bash
./configure --without-node-snapshot \
  --without-node-code-cache \
  --without-npm
make -j4
```

이 빌드는 배포용 바이너리가 아니라 개발 속도를 위한 선택입니다. 최종 검증에서는 실제 배포와 같은
설정도 확인합니다.

#### 기능을 켜거나 빼서 다른 빌드 조합 확인하기

`./configure --help`에는 기능을 포함하거나 제외하는 옵션도 나옵니다. 기능이 없는 환경, 선택 기능의
통합, 배포 구성이 다른 빌드 조합을 검증할 수 있습니다. 다음은 현재 소스 트리에서 가능한
대표 예시이며 각 configure 명령은 독립적으로 사용합니다.

```bash
# ICU 없이 또는 작은 로케일 데이터만 포함
./configure --with-intl=none
./configure --with-intl=small-icu

# SQLite와 FFI가 없어도 나머지 기능이 동작하는지 확인
./configure --without-sqlite --without-ffi

# SSL 없이 빌드: crypto, HTTPS, inspector 등도 함께 비활성화
./configure --without-ssl

# SSL은 유지하고 V8 inspector만 제외
./configure --without-inspector

# 현재 실험 단계인 네트워크 기능 포함
./configure --experimental-quic --experimental-dtls

# 빌드에 포함된 실험 기능을 기본 활성화
./configure --enable-all-experimentals

# 함께 넣는 도구를 바꾼 배포 빌드
./configure --without-amaro --without-npm

# 필요한 configure 명령 하나를 고른 뒤 빌드와 테스트
make -j4
make test
```

실험 기능과 함께 넣는 구성 요소는 이름, 기본값, 지원 여부가 바뀔 수 있습니다. 새 빌드 조합을
만들기 전에는 `./configure --help`와 현재 브랜치의 테스트 target을 다시 확인합니다.

#### 코드 커버리지, 프로파일링, 최적화 확인하기

테스트가 실제 코드를 실행하는지 확인하려면 `--coverage`, 실행 성능을 관찰하려면 `--with-perfetto`를
사용합니다. 배포 성능과 바이너리 최적화를 실험할 때는
`--enable-pgo-generate`, `--enable-pgo-use`, `--enable-lto` 같은 옵션이 있습니다. 플랫폼과 컴파일러
제약이 크므로 일반 개발 빌드와 분리해서 사용합니다.

```bash
./configure --coverage
make coverage
```

#### 다른 플랫폼과 배포 형태 만들기

`--dest-cpu`, `--dest-os`, `--cross-compiling`은 다른 CPU나 OS를 대상으로 빌드합니다. 별도 cross
compiler와 toolchain이 필요합니다. 정적·공유 빌드는 `--fully-static`, `--partly-static`, `--shared`,
`--shared-*`로 설정합니다. 자세한 지원 조건은 [BUILDING.md](https://github.com/nodejs/node/blob/main/BUILDING.md)에 있습니다.

## 반복 빌드 속도 높이기

반복 빌드가 느리다면 병렬 컴파일, Ninja, ccache, mold를 차례로 적용할 수 있습니다. 각각
CPU 병렬 사용, 빌드 작업 배치, 컴파일 결과 재사용, 링크 시간을 다룹니다.

### CPU를 활용한 병렬 컴파일

`-j`는 동시에 실행할 작업 수입니다. CPU 수를 기준으로 시작하되 메모리가 부족하거나 다른 작업을 함께
실행한다면 값을 낮춥니다.

```bash
make -j"$(nproc)"                # GNU/Linux
make -j"$(sysctl -n hw.ncpu)"    # macOS
```

### Ninja

Ninja는 변경된 target을 빠르게 찾아 병렬 빌드합니다. `make`를 사용하면 내부에서 Ninja를 실행하고
저장소 루트의 `./node` 링크도 갱신합니다. Ninja를 직접 실행할 수도 있습니다.

```bash
./configure --ninja

# Makefile을 통해 실행
make       # CPU 수에 맞춰 병렬 실행
make -j4   # 작업 수 제한

# Ninja 직접 실행
ninja -C out/Release
ninja -C out/Release -j4
```

자세한 동작은 [Building Node.js with Ninja](https://github.com/nodejs/node/blob/main/doc/contributing/building-node-with-ninja.md)에
설명되어 있습니다.

### ccache

ccache는 이전 컴파일 결과를 재사용합니다. 여러 브랜치를 오가며 C++를 자주 다시 빌드할 때 효과가 큽니다.
컴파일러 환경 변수는 configure 전에 설정합니다.

```bash
# GNU/Linux + GCC
sudo apt install ccache
export CC="ccache gcc"
export CXX="ccache g++"

# macOS
brew install ccache
export CC="ccache cc"
export CXX="ccache c++"
```

설정 후 `./configure`와 `make`를 실행합니다. 자세한 내용은
[BUILDING.md의 ccache 절](https://github.com/nodejs/node/blob/main/BUILDING.md#ccache)에 있습니다.

캐시가 실제로 쓰이는지는 빌드 전후 통계로 확인합니다.

```bash
ccache --max-size 50GB
ccache --show-config
...
ccache --show-stats
Summary:
  Hits:            600710 /  862387 (69.66 %)
    Direct:        515268 /  710279 (72.54 %)
    Preprocessed:   85442 /  241041 (35.45 %)
  Misses:
```

`Hits`는 컴파일러를 실행하지 않고 기존 결과를 재사용한 횟수이고, `Misses`는 새로 컴파일해 캐시에
저장한 횟수입니다. 첫 빌드에서 `Misses`가 많은 것은 정상입니다. 같은 설정으로 다시 빌드하거나 브랜치를
오갈 때 `Hits`가 늘어나는지 확인합니다. `Cache size`에서는 현재 사용량과 제한도 볼 수 있습니다.

### mold로 링크 시간 줄이기 (GNU/Linux 전용)

mold는 기본 링커 대신 사용할 수 있는 빠른 링커입니다. `LDFLAGS`에 `-fuse-ld=mold`를 지정하면
GCC나 Clang이 링크 단계에서 mold를 사용합니다.

```bash
sudo apt install mold
export LDFLAGS="-fuse-ld=mold"
```

`export`한 `LDFLAGS`는 현재 셸에서 실행하는 다른 빌드에도 적용되며 기존 값을 덮어씁니다. 더 이상
필요하지 않으면 `unset LDFLAGS`로 해제합니다.

## 테스트 실행

테스트 파일을 직접 실행하는 방법이 가장 빠릅니다. 다만 `SKIP`, `FLAKY` 같은 Node.js 테스트 러너의
정책까지 적용하려면 `tools/test.py`를 사용합니다.

```bash
# 직접 실행
./node test/parallel/test-my-changes.js

# 테스트 러너로 파일 하나 실행
tools/test.py test/parallel/test-my-changes.js

# suite나 subsystem 단위로 실행
tools/test.py parallel
tools/test.py stream

# 파일 패턴은 따옴표로 감싸기
tools/test.py "test/*/test-inspector-*"
```

### `.status` 파일 읽기

`tools/test.py`는 `test/<suite>/<suite>.status`에서 suite별 실행 정책을 읽습니다. 예를 들어 parallel
suite의 정책은 [`test/parallel/parallel.status`](https://github.com/nodejs/node/blob/main/test/parallel/parallel.status)에
있고, 여러 suite에 공통으로 적용하는 규칙은 `test/root.status`에 있습니다.

```text
prefix parallel

[true]
test-shadow-realm-gc: SKIP
test-fs-read-stream-concurrent-reads: PASS, FLAKY

[$system==win32]
test-inspector-network-fetch: PASS, FLAKY
```

- `prefix parallel`은 아래 테스트 이름을 `test/parallel/` 기준으로 읽는다는 뜻입니다. 이름에서 `.js`는
  생략합니다.
- `[true]` 아래 규칙은 모든 플랫폼에 적용됩니다.
- `[$system==win32]`처럼 조건이 있는 구역은 해당 플랫폼에서만 적용됩니다. `$arch`, `$mode`,
  `$asan` 같은 빌드와 실행 조건도 사용할 수 있습니다.
- `SKIP`은 조건이 맞으면 테스트를 실행 대상에서 제외합니다.
- `PASS, FLAKY`는 통과해야 하지만 간헐적으로 실패한다고 등록된 테스트입니다. 기본값인
  `--flaky-tests=run`에서는 실행하며, 실패하면 전체 테스트도 실패합니다.

flaky 테스트를 다루는 방식은 실행할 때 바꿀 수 있습니다.

```bash
tools/test.py parallel --flaky-tests=run           # 실행하고 실패도 보고
tools/test.py parallel --flaky-tests=skip          # flaky 테스트 제외
tools/test.py parallel --flaky-tests=dontcare      # 실행하되 flaky 실패는 허용
tools/test.py parallel --flaky-tests=keep_retrying # 실패하면 다시 실행
```

`./node test/parallel/test-name.js`처럼 테스트 파일을 직접 실행하면 `.status` 정책은 적용되지 않습니다.

반복 작업에서는 병렬도 `-j N`, 간헐적인 실패를 재현하는 `--repeat N`, 테스트 프로세스에 Node.js 옵션을
넘기는 `--node-args ARGS`가 유용합니다.

```bash
tools/test.py -j 1 --repeat 20 test/parallel/test-my-changes.js
tools/test.py --node-args="--trace-gc" test/parallel/test-my-memory-case.js
```

전체 옵션과 현재 기본값은 `tools/test.py --help`에 나옵니다.

## 테스트 종류

필요한 target만 먼저 고릅니다. 정확한 실행 범위는 현재 [Makefile](https://github.com/nodejs/node/blob/main/Makefile)에 있습니다.

| target | 범위 |
| --- | --- |
| `make test-only` | 문서 빌드를 제외한 기본 테스트 |
| `make test` | 기본 테스트와 문서 빌드 |
| `make jstest` | JavaScript와 네이티브 addon 테스트 |
| `make cctest` | C++ gtest |

```bash
.PHONY: test-only
test-only: all  ## For a quick test, does not run linter or build docs.
	$(MAKE) build-addons
	$(MAKE) build-js-native-api-tests
	$(MAKE) build-node-api-tests
	$(MAKE) cctest
	$(MAKE) jstest
	$(MAKE) tooltest
```

`test-only:`나 `jstest:`를 검색하면 어떤 빌드와 테스트를 실행하는지 볼 수 있습니다. 실행
내용은 바뀔 수 있으므로 현재 [Makefile](https://github.com/nodejs/node/blob/main/Makefile)을 확인해야 합니다. 개발 중에는 변경과 가까운 테스트부터 실행하고, 변경 범위가 넓거나 `src/`, `lib/`, `doc/`를 함께
고쳤다면 마지막에 `make test`를 실행합니다.

## Format 과 Lint

전체 `make lint`부터 실행할 필요는 없습니다. 변경한 영역의 formatter와 linter로 먼저 확인한 뒤,
커밋 전에 필요한 범위만 넓힙니다.

| 변경 영역 | 자동 수정 또는 포맷 | lint |
| --- | --- | --- |
| JavaScript | `make lint-js-fix` | `make lint-js` |
| C/C++ | `make format-cpp` | `make lint-cpp` |
| Markdown | `make format-md` | `make lint-md` |
| Python | `make lint-py-fix` | `make lint-py` |
| YAML | - | `make lint-yaml` |
| Shell | - | `tools/lint-sh.mjs .` |

`make lint`는 여러 linter를 묶은 상위 target입니다. 포함되는 검사와 준비 단계는 바뀔 수 있으므로
`make help`의 요약과 [Makefile](https://github.com/nodejs/node/blob/main/Makefile)의 `lint:` target을 기준으로
확인합니다. formatter나 Python, shell 검사가 필요한지도 현재 Makefile에서 확인합니다.

### C/C++ 포맷 범위

`make format-cpp`의 기본 `CLANG_FORMAT_START`는 `HEAD`입니다. 현재 HEAD와 작업 트리 사이의 C/C++
diff를 대상으로 합니다.

```bash
# HEAD 이후의 현재 diff
make format-cpp

# 최신 커밋
CLANG_FORMAT_START=HEAD~1 make format-cpp

# 브랜치의 모든 커밋
CLANG_FORMAT_START="$(git merge-base HEAD upstream/main)" make format-cpp
git --no-pager diff --exit-code
```

마지막 형태는 브랜치 전체에서 formatter가 추가로 바꿀 부분이 없는지 확인할 때 씁니다. `make lint-cpp`는
cpplint와 import 검사를 실행하지만 clang-format을 대신하지 않습니다.

### 커밋 메시지 검사

커밋을 만든 뒤 `core-validate-commit`으로 최신 커밋 메시지를 검사합니다.

```bash
npx core-validate-commit --no-validate-metadata HEAD
```

여러 커밋을 올린 브랜치라면 Pull Request에 포함되는 범위를 모두 검사해야 합니다. subsystem과 커밋
메시지 규칙은 Node.js의
[Pull Request guide](https://github.com/nodejs/node/blob/main/doc/contributing/pull-requests.md)를 기준으로
봅니다.

## 빌드 복구

부분 빌드가 실패했다면 원인을 고친 뒤 같은 `make`를 다시 실행합니다. Make는 완료된 산출물을 재사용하고
필요한 target부터 이어갑니다.

```bash
# 증분 빌드 다시 시도
make -j4

# 빌드 결과만 삭제하고 configure 결과는 유지
make clean
make -j4

# 빌드 결과와 configure 결과 삭제
make distclean
./configure
make -j4
```

`clean`이나 `distclean`을 평소 작업에 넣으면 반복만 느려집니다. 컴파일러 옵션이나 의존성
구성이 달라졌거나 오래된 산출물이 실제 원인이라고 볼 근거가 있을 때 사용합니다.

## 관련 자료

| 자료 | 내용 |
| --- | --- |
| [BUILDING.md](https://github.com/nodejs/node/blob/main/BUILDING.md) | 빌드 환경, 플랫폼, toolchain |
| [configure.py](https://github.com/nodejs/node/blob/main/configure.py) | configure 옵션과 빌드 설정 |
| [Makefile](https://github.com/nodejs/node/blob/main/Makefile) | 빌드, lint, 테스트 target과 실행 명령 |
| [tools/test.py](https://github.com/nodejs/node/blob/main/tools/test.py) | 테스트 선택 방법과 러너 옵션 |
| [Building Node.js with Ninja](https://github.com/nodejs/node/blob/main/doc/contributing/building-node-with-ninja.md) | Ninja 설정과 반복 빌드 |
