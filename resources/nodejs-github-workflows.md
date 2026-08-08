---
authors: [daeyeon]
---

# Node.js CI Tasks

프로젝트의 개발과 운영 방식을 이해하려면 CI workflow를 살펴보는 것이 유용합니다. 이 문서는 PR 코드 검증, 의존성 갱신, 보안 분석, 릴리스 준비, 저장소 관리 등 Node.js CI Task를 정리합니다.

## PR 검증 Tasks

PR이 열리거나 갱신되면 GitHub Actions가 다음 검사를 수행합니다.

| 검사 | 내용 |
| --- | --- |
| 빌드, 테스트 | Linux와 macOS ([`test-linux.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/test-linux.yml), [`test-macos.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/test-macos.yml)) |
| commit message | commit message 검사 ([`commit-lint.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/commit-lint.yml)) |
| lint | 언어별 형식 검사 ([`linters.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/linters.yml)) |
| documents | 문서를 빌드하고 결과를 artifact 저장 ([`doc.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/doc.yml)) |
| coverage | coverage 측정 ([`coverage-linux.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/coverage-linux.yml), [`coverage-linux-without-intl.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/coverage-linux-without-intl.yml), [`coverage-windows.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/coverage-windows.yml)) |
| tarball 빌드 | source tarball으로 빌드되는지 테스트 ([`build-tarball.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/build-tarball.yml)) |
| Shared 빌드 | source tarball을 shared library 구성으로 빌드하고 테스트 ([`test-shared.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/test-shared.yml), [`build-shared.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/build-shared.yml)) |

## PR Landing Tasks

Node.js는 GitHub의 PR 병합 기능을 직접 사용하지 않고, `request-ci`와 `commit-queue` 레이블로
CI 실행과 landing 절차를 제어합니다. 이는 GitHub의 기본 병합 기능만으로는 반영하기 어려운
PR 메타데이터를 landing commit에 포함하기 위한 Node.js의 운영 방식입니다.

두 Task는 Node.js 프로젝트가 관리하는 npm 패키지
[`@node-core/utils`](https://github.com/nodejs/node-core-utils)(이하 `ncu`)를 사용합니다. `ncu`는 Node.js
Collaborator가 PR 상태를 확인하고 Jenkins CI를 실행하며 landing과 backport를 처리할 때 쓰는 CLI
도구 모음입니다.

- [request-ci](https://github.com/nodejs/node/labels/request-ci)
    - PR에서 Jenkins CI 실행을 요청하는 레이블입니다. [`auto-start-ci.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/auto-start-ci.yml)이 레이블이 붙은 PR을 찾아 `ncu`의 `ncu-ci run` 명령을 실행합니다. 이 명령은 승인된 최신 commit인지 확인한 뒤 Jenkins의 PR CI를 시작합니다.
- [commit-queue](https://github.com/nodejs/node/labels/commit-queue)
    - 검토와 CI를 마친 PR을 landing 대상으로 등록하는 레이블입니다. [`commit-queue.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/commit-queue.yml)이 `ncu`의 `git node land` 명령으로 landing 조건을 다시 확인한 뒤 PR을 `main`에 반영합니다.

> 좀 더 상세한 Commit Queue 처리 과정은
[Node.js Commit Queue](?view=resources&resource=nodejs-commit-queue)에
정리되어 있습니다.

## 정기 실행 Tasks

### 의존성과 생성 파일 갱신

[`tools.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/tools.yml)은 매주
`tools/dep_updaters/`의 updater를 실행해 30개 이상의 외부 의존성과 도구를 갱신합니다.
모든 의존성이 자동 갱신되는 것은 아니며, 런타임 영향이 큰 의존성은 별도의 검증을 거쳐
수동으로 갱신합니다. 주요 정기 작업은 다음과 같습니다.

| Workflow | 역할 |
| --- | --- |
| [`license-builder.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/license-builder.yml) | 의존성 변경을 반영해 `LICENSE` 갱신 |
| [`update-wpt.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/update-wpt.yml) | 웹 표준 테스트 fixture 갱신 |
| [`update-openssl.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/update-openssl.yml) | OpenSSL 소스와 생성 파일 갱신 |

### WPT (Web Platform Tests) 지원 상황 업데이트

- [`daily-wpt-fyi.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/daily-wpt-fyi.yml)
   - [wpt.fyi](https://wpt.fyi/)는 다양한 웹 플랫폼 구현체의 WPT 결과를 수집하고 비교하는 대시보드입니다. 이 Task는 Node.js와 Undici의 WPT 결과를 [Node.js 비교 현황](https://wpt.fyi/results/?label=master&label=experimental&product=node.js&product=chrome&product=firefox&product=safari&q=node.js%3A%21missing)에 게시해 Node.js의 웹 표준 지원 수준을 다른 구현체와 비교할 수 있게 합니다.

### 빌드가 깨지기 쉬운 빌드 옵션 검증

- [`daily.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/daily.yml)
   - `--enable-lto --ninja`로 Release binary를 매일 빌드해 LTO 구성의 build breakage를 조기에 발견합니다.

### 보안 Tasks

- [`codeql.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/codeql.yml)
    -  매일 C/C++, JavaScript, Python용 CodeQL database를 초기화하고 autobuild와 보안 쿼리를 실행합니다. 분석 결과는 언어별로 GitHub code scanning에 등록됩니다.
- [`scorecard.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/scorecard.yml)
    - GitHub Actions 권한, 의존성 버전 고정, 브랜치 보호 등 저장소의 공급망 보안 설정을 OpenSSF Scorecard 기준으로 평가합니다. 결과를 OpenSSF에 게시하고, SARIF 파일은 artifact로 5일간 보관한 뒤 GitHub code scanning에도 등록합니다.

### 저장소 관리 Tasks

- [`stale.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/stale.yml)
    - 90일 동안 갱신되지 않은 이슈와 PR에 `stale` 레이블과 안내문을 추가하고, 이후 30일 동안 활동이 없으면 닫습니다. `never-stale` 이슈와 PR, `confirmed-bug` 이슈는 제외하며 새 활동이 생기면 `stale` 레이블을 제거합니다.

- [`find-inactive-collaborators.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/find-inactive-collaborators.yml)
    - 최근 12개월의 commit 작성자, `Co-authored-by`, `Reviewed-by` 기록을 `README.md`의 Collaborator 목록과 대조합니다. 기록이 없는 Collaborator를 emeritus 목록으로 옮기는 `meta` PR을 만들고 TSC에 offboarding 절차를 요청합니다.

- [`find-inactive-tsc.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/find-inactive-tsc.yml)
    - `nodejs/TSC` 저장소의 최근 세 차례 투표 기록과 Node.js의 TSC voting member 목록을 대조합니다. 세 번 모두 참여하지 않은 기존 voting member를 regular member로 옮기는 `meta` PR을 만들고, 대상과 투표 내역을 적어 TSC에 후속 조치를 요청합니다.

- [`major-release.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/major-release.yml)
    - 2월 15일과 8월 15일에 `nodejs/Release`의 `schedule.json`에서 다음 major 버전과 릴리스 날짜를 읽습니다. 릴리스 두 달 전에 이슈를 열어 일정을 알리고, semver-major 변경의 반영 마감일을 릴리스 한 달 전으로 명시합니다.


## 수동 실행 Tasks

PR 검증이나 릴리스 라인 생성처럼 실행 시 입력이 필요한 작업은 수동으로 시작합니다.

- [`benchmark.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/benchmark.yml)
    - PR의 base commit과 merge commit을 Linux·macOS의 x64·ARM64에서 각각 빌드해 지정한 benchmark를 비교합니다. 원시 CSV와 플랫폼별·통합 결과를 남깁니다.

- [`stress-test.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/stress-test.yml)
    -  테스트 경로, 운영체제, 반복 횟수, 병렬 작업 수를 입력받아 같은 테스트를 반복하고 간헐적 실패를 찾습니다.

- [`create-release-proposal.yml`](https://github.com/nodejs/node/blob/main/.github/workflows/create-release-proposal.yml)
    - release line과 날짜를 기준으로 [`create-release-proposal.sh`](https://github.com/nodejs/node/blob/main/tools/actions/create-release-proposal.sh)가 release commit과 changelog를 만들고, `vN.x` 브랜치에 합칠 draft PR을 생성합니다. PR에는 `release`, `vN.x` 레이블을 붙이고 workflow를 실행한 Collaborator를 assignee로 지정합니다.


## CI Task 소스 구조

GitHub Actions 코드는 세 디렉터리에 나뉘어 있습니다.

```text
.github/
├── actions/       # 저장소 안에서 재사용하는 composite action
└── workflows/     # workflow 정의

tools/
└── actions/       # workflow가 호출하는 Node.js 전용 스크립트
```

소스 보기: [`.github/actions`](https://github.com/nodejs/node/tree/main/.github/actions), [`.github/workflows`](https://github.com/nodejs/node/tree/main/.github/workflows), [`tools/actions`](https://github.com/nodejs/node/tree/main/tools/actions)
