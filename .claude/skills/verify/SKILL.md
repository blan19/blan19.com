---
name: verify
description: blan19.com 변경을 운영 DB 차단 상태로 검증한다(prisma generate, tsc, eslint, content:check, next build, smoke). 실패를 해석하고 결과를 정해진 형식으로 보고한다.
when_to_use: 사용자가 코드나 글을 바꾼 뒤 "검증해줘", "빌드 되는지 확인", "타입체크", "린트", "배포해도 돼?", "PR 올리기 전 확인", "verify", "check the build", "run checks" 같은 요청. 작업을 끝냈다고 보고하기 전에 항상 쓴다.
argument-hint: "[full|quick|content]"
---

# /verify

인자 `$ARGUMENTS` 가 없으면 `full` 로 실행한다. 이 프로젝트에는 앱 테스트 코드가 없으므로 아래 검사가 검증의 전부다(`.claude/hooks/` 를 고쳤다면 `npm run test:hooks` 도 실행한다).

## 범위 선택

| 범위 | 언제 | 명령 |
|---|---|---|
| `full` | 기본. 코드, 설정, 의존성, 스키마, 라우트 변경. 작업 완료 보고 전 | `npm run verify` (빌드 캐시가 있으면 10초 안팎, 첫 빌드는 더 걸림) |
| `quick` | 작은 TS/TSX 수정 중간 점검 | `npm run typecheck && npm run lint` |
| `content` | `contents/` 만 바꿨을 때 | `npm run content:check` (글 렌더까지 보려면 `full`) |

`npm run verify` 는 스스로 DB 차단 env 를 쓰고 첫 실패에서 멈춘다. 마지막에 `PASS/FAIL/SKIP` 요약이 나온다. 실행 전에 같은 `.next` 를 쓰는 `next start` 서버가 떠 있으면 종료한다.

## 실패 해석

- **prisma generate**: `prisma/schema.prisma` 문법 오류다. `npx prisma validate` 로 위치를 확인한다.
- **tsc**:
  - `TS2307 Cannot find module '@/generated/prisma/client'` 이면 `npx prisma generate` 를 실행한다.
  - Next 16 에서 `params` 타입 오류가 나면 `Promise<{…}>` 로 선언하고 `await` 한다.
- **eslint**: `eslint-config-next/core-web-vitals` 규칙 위반이다. 고친 뒤 해당 파일만 `npx eslint <file>` 로 다시 확인한다.
- **content:check**: 한 줄에 하나씩 `<path>: [error|warn] <메시지>` 형식이다. error 는 전부 고친다. 손대지 않은 기존 글의 warn 은 알려진 것이다. 바꾼 파일의 warn 만 보고한다(`npm run content:check <파일>` 로 범위를 좁힌다). `TODO:` warn(코드 블록 밖)은 커밋 전에 해소해야 한다. CI 에서는 error 다.
- **next build**: 출력의 첫 `Error`/`⨯` 를 본다. 정적 라우트(`/log`, RSS, sitemap, robots)가 prerender 중 실패하면 fs 로더(`src/lib/posts.ts`)나 frontmatter 문제일 가능성이 크다. `Could not find the Next.js package (next/package.json)` 는 `node_modules` 가 프로젝트 밖을 가리키는 심볼릭 링크일 때(worktree 끼리 공유 등) Turbopack 이 내는 오류다. 심볼릭 링크(`ls -ld node_modules`)면 그 위에서 `npm ci`/`npm install` 을 실행하지 않는다(링크된 다른 worktree 의 의존성이 바뀐다). 사용자에게 보고하고 처리 방법(예: 링크를 지우고 이 worktree 에 따로 설치)을 정하게 한다. 실제 디렉터리일 때만, 사용자에게 알린 뒤 `npm ci` 를 실행할 수 있다.
- **smoke**: `FAIL` 행의 path, 상태, 기대값을 본다.
  - "DB 와 무관한 서버 오류 N건"이 나오면 실패다. 전체 서버 로그는 출력에 나온 경로(`$TMPDIR/blan19-smoke-server.log`)에 있다.
  - `127.0.0.1:1` / `P1001` 로그는 DB 차단이 정상 동작한다는 뜻이다.
  - 한계: smoke 는 `scripts/smoke.mjs` 의 `checks` 에 있는 경로(+ 모든 tech 글)만 요청하고, HTTP 상태와 content-type 만 본다. 새 라우트는 `checks` 에 넣어야 검사된다. DB 를 쓰는 페이지(`/`, `/tech`, `/tech/<slug>`)는 차단 env 에서 브라우저가 에러 화면(`error.tsx`)으로 바꿔도 200 이다. UI 를 바꿨다면 `/run-app` 으로 화면을 직접 확인한다.

같은 실패를 두 번 고쳐도 계속되면 멈추고 원인 가설과 함께 사용자에게 보고한다. 검사를 끄거나 건너뛰어(eslint-disable, `@ts-ignore`, 검사기 수정) 통과시키지 않는다.

금지 명령은 CLAUDE.md 의 운영 DB 안전 규칙을 따른다. 검증용으로 `npm run dev`, `npm start`, `vercel-build` 를 쓰지 않는다.

## 보고 형식

```
검증: full | quick | content
- prisma generate  PASS
- tsc --noEmit     PASS
- eslint .         PASS
- content:check    PASS (error 0, 바꾼 파일 warn 0)
- next build       PASS
- smoke            PASS (N/N)
결론: 통과 / 실패(실패 단계, 원인, 조치 또는 남은 문제)
```

실행하지 않은 단계는 `SKIP` 으로 적고, 통과를 주장할 때는 이번에 실행한 출력만 근거로 쓴다.
