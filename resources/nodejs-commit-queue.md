---
authors: [daeyeon]
---
# Commit Queue

Node.js에서는 검토를 마친 PR을 `main`에 반영하는 작업을 landing이라고 합니다. Commit Queue는 준비를
마친 PR을 찾아 검사한 뒤 `main`에 반영하는 CI Task입니다.

## Commit Queue와 ncu

Commit Queue는 Node.js 프로젝트가 관리하는 npm package `@node-core/utils`(이하 ncu)를 사용합니다. ncu를
설치하면 `git node`를 Git external subcommand로 실행할 수 있습니다. Git 자체를 바꾸는 방식은 아닙니다.

Commit Queue가 PR을 `main`에 반영할 때 사용하는 ncu 명령은 `git node land`입니다. 이 명령은 승인, 대기 시간,
CI 상태 등 반영에 필요한 조건을 확인하고 `main`에 반영할 commit을 정리합니다.

일반적으로 Commit Queue가 CI에서 이 명령을 자동으로 실행합니다만, 때로는 Collaborator가 수동으로 PR을 반영할 때도 있습니다. 이때도, CI 에서와 같이 ncu를 사용해 검사와 반영 할 commit을 준비합니다. 로직의 구현은
[`land.js`](https://github.com/nodejs/node-core-utils/blob/main/components/git/land.js#L151-L218)와 [`landing_session.js`](https://github.com/nodejs/node-core-utils/blob/main/lib/landing_session.js#L46-L306)에서 확인 할 수 있습니다.

## 전체 흐름

Commit Queue는 다음 순서로 PR을 처리합니다.

1. [commit-queue](https://github.com/nodejs/node/labels/commit-queue) 레이블이 붙은 PR을 찾습니다.
2. 해당 PR의 CI가 아직 시작되지 않았거나 실행 중이면 다음 실행까지 기다립니다.
3. CI가 끝나면 `commit-queue` 레이블을 제거하고 `main` 반영 작업을 시작합니다.
4. `git node land`로 최신 변경의 승인, 대기 시간, CI 결과를 확인합니다.
5. 검사를 통과하면 commit을 정리해 최신 `main`에 반영합니다.
6. 결과를 댓글로 PR에 기록합니다.

Commit Queue는 5분마다 자동으로 실행되지만 상황에 따라 늦어질 수 있습니다. 또 동시에 여러 개 실행되지
않고, PR에 `commit-queue` 레이블이 붙어 있어도 레이블을 붙인 순서대로 처리되지는 않습니다.
아래는 위 흐름에 대한 좀 더 자세한 설명입니다.

## 1. Queue 등록과 CI 대기

Commit Queue라는 이름처럼 첫 단계는 PR을 `main`에 반영할 queue(대기열)에 등록하는 것입니다. PR이 반영
승인을 받은 뒤 Collaborator가 `commit-queue` 레이블을 붙이면 queue 등록이 시작됩니다.

> 승인을 마쳤더라도 이 레이블이 없으면 queue에 등록되지 않습니다. 승인이 끝난 PR이 계속 진행되지 않는다면
Collaborator에게 레이블을 확인해 달라고 요청할 필요가 있습니다.

PR이 처리 대상이 되려면 다음 조건을 모두 만족해야 합니다.

- 대상 branch가 `main`
- `commit-queue` 레이블이 있음
- PR을 만든 지 2일 이상 지남
- [blocked](https://github.com/nodejs/node/labels/blocked) 레이블이 없음

`commit-queue`와 [fast-track](https://github.com/nodejs/node/labels/fast-track) 레이블이 모두 붙은 PR은 2일을
기다리지 않습니다. 다만 이때도 `git node land`로 fast-track 요청 댓글과 Collaborator의 승인을 다시
확인합니다.

### CI가 끝날 때까지 대기

PR의 CI가 아직 시작되지 않았거나 실행 중이면 Commit Queue는 이번 실행에서 해당 PR을 건너뜁니다.
`commit-queue` 레이블은 그대로 두고 다음 실행에서 다시 확인합니다. CI가 끝나면 다음 단계에서 최신
commit의 CI 결과를 검사합니다.

## 2. 반영 조건 검사

대기할 CI가 없으면 Commit Queue가 `commit-queue` 레이블을 제거하고 `git node land`를 실행합니다. 다음 검사
중 하나라도 통과하지 못하면 `main` 반영을 중단합니다.

### 승인과 대기 시간

마지막으로 승인받은 commit과 PR의 최신 commit이 같아야 합니다. 승인 뒤 commit을 추가했다면 새 승인이
필요합니다. 대기 시간은 PR 생성 시각부터 계산합니다.

| 유효한 승인 | `main` 반영이 가능한 시점 |
| --- | --- |
| 2개 이상 | PR 생성 후 48시간 |
| 1개 | PR 생성 후 7일 |

`Changes requested` 상태가 남아 있으면 반영할 수 없습니다.
[semver-major](https://github.com/nodejs/node/labels/semver-major) 레이블이 붙은 PR은 Node.js Technical
Steering Committee(TSC) 승인이 2개 이상 필요합니다. `fast-track`은 승인 조건을 충족한 경우에만 대기
시간을 생략합니다.

### 최신 CI

최신 commit의 GitHub Actions가 모두 성공해야 합니다.
[needs-ci](https://github.com/nodejs/node/labels/needs-ci) 레이블이 있거나 코드, 빌드 파일을 바꾼 PR은 Jenkins
full CI도 통과해야 합니다. Markdown 파일만 바꾼 PR은 일반적으로 Jenkins CI가 필요하지 않습니다. 모든 CI
결과는 최신 commit을 기준으로 합니다.

### PR 상태

PR이 열려 있고 merge conflict가 없어야 합니다.

## 3. commit 준비

검사를 통과하면 `git node land`는 앞서 검사한 commit과 실제로 가져온 commit이 같은지 비교합니다. 검사 중
PR이 바뀌었다면 중단하고, 바뀌지 않았다면 commit을 최신 `main` 위에 적용합니다.

여러 commit을 어떻게 정리할지는 보조 레이블로 정합니다.

| 레이블 | commit 처리 |
| --- | --- |
| 없음 | 한 commit만 허용. 여러 개면 실패 |
| [commit-queue-squash](https://github.com/nodejs/node/labels/commit-queue-squash) | 모든 commit을 첫 commit으로 합침 |
| [commit-queue-rebase](https://github.com/nodejs/node/labels/commit-queue-rebase) | 여러 commit을 유지한 채 rebase |

서로 이어지는 변경을 한 PR에 담되, 각 단계의 구분을 commit history에 남겨야 하는 경우에는 여러 commit을
유지할 수 있습니다. 이때 `commit-queue-rebase` 레이블을 붙입니다. 권한이 있으면 직접 붙이고, 그렇지 않으면
Collaborator와 상의합니다. Collaborator가 commit 구성을 보고 먼저 붙이기도 합니다.

Node.js는 보통 squash를 권합니다. rebase를 선택하려면 각 commit이 독립적으로 빌드와 테스트를 통과해야
합니다. 자세한 원칙은
[Collaborator guide](https://github.com/nodejs/node/blob/main/doc/contributing/collaborator-guide.md#landing-pull-requests)에
있습니다.

commit 구조를 정리한 뒤에는 메시지에 `PR-URL`, `Fixes`, `Refs`, `Reviewed-By` 같은 정보를 붙이고
[`core-validate-commit`](https://github.com/nodejs/core-validate-commit)으로 최종 검사합니다. commit 제목이나 필수 정보가 Node.js 규칙에 맞지 않으면
여기서 실패합니다.

## 4. `main` 반영

`git node land`는 commit을 준비하고 push 방법을 출력한 뒤 끝납니다. `main` 반영은
[`commit-queue.sh`](https://github.com/nodejs/node/blob/main/tools/actions/commit-queue.sh#L74-L102)가 이어서
처리하며, 반영에 성공하면 commit SHA 또는 범위가 PR 댓글로 남습니다.

## 실패 로그 읽기

`main` 반영을 시작한 뒤 `git node land`, merge API, push 중 하나가 실패하면 `commit-queue` 레이블은 제거된
상태로 남습니다. 대신 [commit-queue-failed](https://github.com/nodejs/node/labels/commit-queue-failed) 레이블과
실패 댓글이 추가됩니다.

실패 댓글에는 GitHub Actions 실행 링크와 `git node land` 출력이 들어 있습니다. 아래는 실패 로그 예입니다.

```text
- Loading data for nodejs/node/pull/12345
✔ Done loading data for nodejs/node/pull/12345

Title   stream: improve example behavior (#12345)
Author  Example Contributor <contributor@example.com> (@example-contributor)
Commits 1

✔ Approvals: 3
✔ Last GitHub CI successful
✔ Last Jenkins CI successful
✔ Patches applied

✖ Commit must have a "Signed-off-by" trailer  signed-off-by
ℹ Please fix the commit message and try again.

git commit --amend
git node land --continue
```

앞선 승인과 CI 검사는 통과했지만, 최종 commit 검사에서 `Signed-off-by`가 없어 중단된 경우입니다. 첫 번째
`✖` 항목을 보면 실패 원인과 고쳐야 할 부분을 찾을 수 있습니다.

원인을 고친 뒤 필요한 승인과 CI를 다시 받고 `commit-queue` 레이블을 붙여야 합니다. 실패한 PR은 자동으로
Commit Queue에 다시 들어가지 않습니다. 충돌 해결이나 commit 재구성이 필요하면 수동 `git node land` 를
하는 경우도 많이 있습니다.
