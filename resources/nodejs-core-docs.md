---
authors: [daeyeon]
---
# Node.js 개발 문서 안내

Node.js 코어 개발에 필요한 문서를 작업별로 정리했습니다. 기여를 시작하거나, JavaScript와 C++ 구현 규칙, 빌드, 테스트 방법,유지보수와 협업 정책을 찾을 때 해당 영역부터 보면 됩니다.

## 개발 문서

| 영역 | 문서 | 설명 |
| --- | --- | --- |
| 기여 시작 | [CONTRIBUTING.md](https://github.com/nodejs/node/blob/main/CONTRIBUTING.md) | 저장소 전체 기여 규칙 |
|  | [Guides and FAQs](https://github.com/nodejs/node/blob/main/doc/contributing/first-contributions.md) | 첫 기여자를 위한 안내 |
|  | [Issues](https://github.com/nodejs/node/blob/main/doc/contributing/issues.md) | 이슈 작성과 참여 기준 |
|  | [Pull requests](https://github.com/nodejs/node/blob/main/doc/contributing/pull-requests.md) | 제출부터 리뷰와 landing까지 |
| 빌드와 configure | [BUILDING.md](https://github.com/nodejs/node/blob/main/BUILDING.md) | 플랫폼별 도구와 빌드·테스트 방법 |
|  | [Building Node.js with Ninja](https://github.com/nodejs/node/blob/main/doc/contributing/building-node-with-ninja.md) | Ninja를 이용한 반복 빌드 설정 |
|  | [GN Build](https://github.com/nodejs/node/blob/main/doc/contributing/gn-build.md) | Chromium 계열 프로젝트를 위한 비공식 GN 빌드 |
|  | [Node.js startup snapshot builder](https://github.com/nodejs/node/blob/main/tools/snapshot/README.md) | bootstrap snapshot의 생성 과정과 오류 조사 |
| JavaScript 코어 | [Primordials](https://github.com/nodejs/node/blob/main/doc/contributing/primordials.md) | 사용자 코드의 built-in 변경으로부터 코어를 보호하는 방법 |
|  | [Using internal errors](https://github.com/nodejs/node/blob/main/doc/contributing/using-internal-errors.md) | Node.js 오류 코드 추가 방법 |
|  | [Using symbols](https://github.com/nodejs/node/blob/main/doc/contributing/using-symbols.md) | local·global symbol 선택 기준 |
|  | [Explicit Resource Management](https://github.com/nodejs/node/blob/main/doc/contributing/erm-guidelines.md) | `using`과 disposable object에 대한 API 적용 기준 |
|  | [`eslint.config.mjs`](https://github.com/nodejs/node/blob/main/eslint.config.mjs) | 저장소 전체 JavaScript lint 설정 |
|  | [`eslint.config_partial.mjs`](https://github.com/nodejs/node/blob/main/lib/eslint.config_partial.mjs) | JavaScript 코어 구현에 추가로 적용되는 lint 규칙 |
| C++ 코어 | [Node.js C++ codebase](https://github.com/nodejs/node/blob/main/src/README.md) | C++ 구조와 바인딩 지도 |
|  | [C++ Style Guide](https://github.com/nodejs/node/blob/main/doc/contributing/cpp-style-guide.md) | 이름, 소유권, 오류 처리 규칙 |
|  | [Node.js QUIC Implementation](https://github.com/nodejs/node/blob/main/src/quic/README.md) | QUIC·HTTP/3 native 구현의 구조와 생명주기 |
|  | [Node.js crypto documentation](https://github.com/nodejs/node/blob/main/src/crypto/README.md) | crypto 바인딩과 내부 공통 패턴 |
|  | [Investigating native memory leaks](https://github.com/nodejs/node/blob/main/doc/contributing/investigating-native-memory-leaks.md) | Valgrind로 C/C++ 메모리 누수를 조사하는 방법 |
|  | [Static Analysis](https://github.com/nodejs/node/blob/main/doc/contributing/static-analysis.md) | Coverity 결과를 확인하는 방법 |
|  | [Postmortem support](https://github.com/nodejs/node/blob/main/doc/contributing/node-postmortem-support.md) | core dump 분석에 필요한 V8·Node.js 메타데이터 |
| JS와 C++ 경계 | [Binding functions](https://github.com/nodejs/node/blob/main/src/README.md#binding-functions) | C++ 함수를 JavaScript에 노출하는 구조 |
|  | [Argument validation](https://github.com/nodejs/node/blob/main/src/README.md#argument-validation-in-public-apis-vs-internal-code) | 공개 API와 내부 코드의 인자 검증 차이 |
|  | [Adding a new Node-API](https://github.com/nodejs/node/blob/main/doc/contributing/adding-new-napi-api.md) | ABI를 지키며 Node-API를 확장하는 절차 |
|  | [Adding a V8 Fast API](https://github.com/nodejs/node/blob/main/doc/contributing/adding-v8-fast-api.md) | native 바인딩에 빠른 호출 경로를 추가하는 방법 |
|  | [FFI Fast API internals](https://github.com/nodejs/node/blob/main/doc/contributing/ffi-fast-api-internals.md) | `node:ffi`의 V8 Fast API 최적화 구조 |
| 테스트 | [Writing tests](https://github.com/nodejs/node/blob/main/doc/contributing/writing-tests.md) | 코어 테스트 규칙과 helper 사용법 |
|  | [Node.js Core Tests](https://github.com/nodejs/node/blob/main/test/README.md) | 테스트 종류, 위치, 실행 방법 |
|  | [Test Common Modules](https://github.com/nodejs/node/blob/main/test/common/README.md) | 공통 테스트 helper 목록 |
|  | [Web Platform Tests](https://github.com/nodejs/node/blob/main/test/wpt/README.md) | upstream WPT 연동 방법 |
|  | [WASI Tests](https://github.com/nodejs/node/blob/main/test/wasi/README.md) | WASI test fixture를 다시 만드는 방법 |
| 문서와 API | [Node.js documentation style guide](https://github.com/nodejs/node/blob/main/doc/README.md) | 저장소 문서의 형식과 용어 규칙 |
|  | [Writing documentation](https://github.com/nodejs/node/blob/main/doc/contributing/writing-docs.md) | API Markdown의 메타데이터와 링크 규칙 |
|  | [API documentation tooling](https://github.com/nodejs/node/blob/main/doc/contributing/api-documentation.md) | API 문서를 HTML·JSON으로 만드는 도구 |
| 성능 | [Writing and running benchmarks](https://github.com/nodejs/node/blob/main/doc/contributing/writing-and-running-benchmarks.md) | 두 빌드를 측정하고 비교하는 절차 |
|  | [Node.js Core Benchmarks](https://github.com/nodejs/node/blob/main/benchmark/README.md) | 벤치마크 배치와 harness API |
| 개발용 플래그 | [Internal API documentation](https://github.com/nodejs/node/blob/main/doc/contributing/internal-api.md) | 코어 개발용 명령줄 플래그 목록 |
| 유지보수 | [Maintaining Dependencies](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-dependencies.md) | [V8](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-V8.md), [ICU](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-icu.md), [OpenSSL](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-openssl.md), [merve](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-merve.md), [root certificates](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-root-certs.md), [HTTP](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-http.md), [shared library](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-shared-library-support.md), [Single Executable Applications](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-single-executable-application-support.md), [WebAssembly](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-web-assembly.md), [types](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-types-for-nodejs.md), [build files](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-the-build-files.md) |

## 협업과 정책 문서

| 영역 | 문서 | 설명 |
| --- | --- | --- |
| 협업과 리뷰 | [Collaborator guide](https://github.com/nodejs/node/blob/main/doc/contributing/collaborator-guide.md) | 리뷰, CI, API 변경, landing 정책 |
|  | [Large pull requests](https://github.com/nodejs/node/blob/main/doc/contributing/large-pull-requests.md) | 큰 변경의 작성·검토·승인 기준 |
| 설계 판단 | [Technical values](https://github.com/nodejs/node/blob/main/doc/contributing/technical-values.md) | 기술적 의사결정의 공통 가치와 우선순위 |
|  | [Technical priorities](https://github.com/nodejs/node/blob/main/doc/contributing/technical-priorities.md) | 현재 프로젝트가 중요하게 보는 기술 영역 |
|  | [Components in core](https://github.com/nodejs/node/blob/main/doc/contributing/components-in-core.md) | 기능이나 의존성을 코어에 포함할지 판단하는 기준 |
| Landing과 backport | [Commit queue](https://github.com/nodejs/node/blob/main/doc/contributing/commit-queue.md) | GitHub Actions를 이용한 자동 landing |
|  | [Backporting](https://github.com/nodejs/node/blob/main/doc/contributing/backporting-to-release-lines.md) | release staging branch로 변경을 옮기는 절차 |

## 기여를 시작할 때

처음이라면 [Guides and FAQs](https://github.com/nodejs/node/blob/main/doc/contributing/first-contributions.md)부터
보는 편이 빠릅니다. 개발 환경을 준비하고, 작업할 이슈를 고르고, 작은 PR을 만드는 과정이 한 흐름으로
정리돼 있습니다. 저장소 전체 규칙은 [CONTRIBUTING.md](https://github.com/nodejs/node/blob/main/CONTRIBUTING.md)에서
확인할 수 있습니다.

## 빌드와 configure를 다룰 때

[BUILDING.md](https://github.com/nodejs/node/blob/main/BUILDING.md)가 기본 문서입니다. 지원 플랫폼과
toolchain, configure 옵션, 빌드와 테스트 방법이 함께 들어 있습니다. 반복 빌드 시간을 줄이고 싶다면
[Building Node.js with Ninja](https://github.com/nodejs/node/blob/main/doc/contributing/building-node-with-ninja.md)를
이어 읽으면 됩니다.

## JavaScript 코어를 고칠 때

JavaScript로 작성된 Node.js 내장 모듈 (builtins)은 `lib/`에 있습니다. 이 코드는 사용자 코드가 `Array`나
`Promise` 같은 built-in을 바꿔도 영향을 받지 않아야 합니다. Node.js 오류 코드를 다루는 규칙도 중요합니다.
[Primordials](https://github.com/nodejs/node/blob/main/doc/contributing/primordials.md)와
[Using internal errors](https://github.com/nodejs/node/blob/main/doc/contributing/using-internal-errors.md)가 이 두
주제를 설명합니다.

## C++와 바인딩을 고칠 때

[Node.js C++ codebase](https://github.com/nodejs/node/blob/main/src/README.md)는 `src/`의 주요 클래스와 바인딩
구조를 찾기 위한 지도에 가깝습니다. 이름과 소유권, 오류 처리 방식은
[C++ Style Guide](https://github.com/nodejs/node/blob/main/doc/contributing/cpp-style-guide.md)에 정리돼 있습니다.
Node-API를 확장하거나 C/C++ 메모리 문제를 조사하는 작업처럼 목적이 뚜렷하다면 표에서 바로 해당 문서로
이동하는 편이 빠릅니다.

## 테스트를 쓰거나 찾을 때

[Writing tests](https://github.com/nodejs/node/blob/main/doc/contributing/writing-tests.md)에는 테스트를 작고
독립적으로 만드는 법, 플래그와 공통 helper를 쓰는 법이 담겨 있습니다. 어느 디렉터리에 파일을 둘지 모르겠다면
[Node.js Core Tests](https://github.com/nodejs/node/blob/main/test/README.md)에서 디렉터리 구성을 먼저 확인하면
됩니다. Web API와 WASI는 별도 runner와 fixture 규칙이 있으므로 표의 전용 문서를 따릅니다.

## 문서와 API를 고칠 때

[Node.js documentation style guide](https://github.com/nodejs/node/blob/main/doc/README.md)는 문장과 코드 블록,
링크를 쓰는 기본 형식을 다룹니다. `doc/api`를 고칠 때는
[Writing documentation](https://github.com/nodejs/node/blob/main/doc/contributing/writing-docs.md)도 함께 봐야
합니다. API 메타데이터와 변경 이력, 타입 표기 규칙은 이쪽에 더 자세히 나옵니다.

## 성능을 확인할 때

[Writing and running benchmarks](https://github.com/nodejs/node/blob/main/doc/contributing/writing-and-running-benchmarks.md)에서
두 빌드를 같은 환경에서 반복 측정하고 결과를 비교하는 방법을 설명합니다. 벤치마크를 어디에 두고 어떤
harness를 써야 하는지는 [Node.js Core Benchmarks](https://github.com/nodejs/node/blob/main/benchmark/README.md)에
정리돼 있습니다.

## 개발용 플래그를 찾을 때

[Internal API documentation](https://github.com/nodejs/node/blob/main/doc/contributing/internal-api.md)은
`--expose-internals`처럼 일반 사용자에게 공개하지 않은 개발용 플래그를 모아 둡니다. 코어 테스트나 내부
모듈을 직접 확인할 때 유용하지만 릴리스 사이에 바뀔 수 있습니다.

## 의존성과 빌드 파일을 유지보수할 때

[Maintaining Dependencies](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-dependencies.md)에서
관리할 의존성의 전용 문서를 찾을 수 있습니다. 각 문서에는 새 버전을 가져오는 절차와 생성 파일,
테스트에서 확인할 부분이 정리돼 있습니다.

## 협업과 정책을 확인할 때

[Collaborator guide](https://github.com/nodejs/node/blob/main/doc/contributing/collaborator-guide.md)는 리뷰부터
landing까지 Collaborator가 지켜야 할 절차를 다룹니다. 새 기능을 코어에 넣어야 하는지, 큰 PR에 어떤
합의가 필요한지처럼 구현 밖의 판단이 필요할 때는 정책 표에서 주제에 맞는 문서를 찾으면 됩니다.
