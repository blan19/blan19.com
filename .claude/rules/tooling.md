---
paths:
  - "scripts/**"
  - ".claude/hooks/**"
  - ".claude/settings.json"
  - ".github/**"
  - "package.json"
---

# 도구(scripts, hooks, settings, CI) 규칙

운영 DB 안전 규칙과 명령 표는 CLAUDE.md 를 따른다. 이 파일은 파일을 옮기거나 이름을 바꿀 때 같이 고쳐야 하는 하드코딩 경로 목록이다. 대부분은 verify 나 훅이 실패해 드러나지만, "조용히" 로 적은 항목은 오류 없이 동작이 바뀌어 검사로 잡히지 않는다.

## 경로 결합

| 경로 | 쓰는 곳 | 틀어지면 |
|---|---|---|
| `src/lib/markdown/languages.ts` | `scripts/validate-content.mjs`(`CODE_LANGUAGES`·`PLAIN_LANGUAGES`·`DIAGRAM_LANGUAGES` 배열과 `LANGUAGE_ALIASES` 키를 정규식으로 읽음. 큰따옴표, 한 줄에 하나 형식 전제) | 경로나 형식이 바뀌어 목록을 못 읽으면 content:check 가 error. 배열 항목만 바꾸고 `src/lib/markdown/shiki.ts` 의 `langs` import 목록을 안 바꾸면 검사는 통과하지만 그 언어는 렌더 때 하이라이트 실패 |
| 글 페이지 고정 id(`main`: `src/app/layout.tsx`, `post-head`: `ui/post-header`, `post-body`: `ui/post-body`, `footnote-label`: remark-rehype 각주 제목, `ref-label`: `ui/post-references`, `cm-label`: `ui/comment`) | `validate-content.mjs` 의 `FIXED_PAGE_IDS`(제목 slug 와 겹치면 warn). `github-slugger` 는 `rehype-slug` 의 의존성(직접 의존성 아님)을 그대로 import 한다 | 조용히: 목록을 안 고치면 겹치는 제목을 못 잡는다. `rehype-slug` 가 slugger 를 바꾸면 검사기 slug 가 렌더러와 어긋난다 |
| `next.config.js` | `validate-content.mjs`(`require` 로 `images.remotePatterns`), ci.yml 캐시 키 | 허용 호스트가 `[]` 가 되어 원격 이미지가 모두 error |
| `contents/` | `post-edit-check.mjs`(`.mdx` 검사 대상 접두어), `validate-content.mjs`, `smoke.mjs`(`contents/tech` 에서 slug 선택), `guard-bash.test.mjs`(픽스처), ci.yml 캐시 키 | content:check 와 smoke 실패. 훅의 글 검사는 조용히 빠짐 |
| `scripts/validate-content.mjs` | `post-edit-check.mjs`, `verify.mjs`, `package.json`, settings.json allow | 훅 실패 |
| `scripts/with-blocked-db.mjs` | `guard-bash.mjs`(basename `with-blocked-db.mjs` 로 DB 차단 실행을 허용), `verify.mjs`·`smoke.mjs`(import), `package.json`(`dev:safe`), ci.yml, settings.json allow, skills | 차단 실행이 거부되거나 권한 확인이 늘어남 |
| `prisma/schema.prisma` | `guard-bash.mjs`(push/PR 확인 조건) | 스키마 변경 push 확인이 사라짐 |
| `src/generated/prisma` | `session-start.mjs`, `post-edit-check.mjs`(SKIP_DIRS), eslint ignore, `.gitignore`, schema.prisma output | 상태 표시와 lint 대상이 틀어짐 |
| `src/app/og/Pretendard-Bold.woff` | `src/app/og/route.tsx`(`process.cwd()` 기준 `readFile`) | smoke 의 `/og` 실패. 경로를 고쳐도 새 위치가 Vercel 파일 트레이싱에 안 잡히면 운영에서만 실패 |
| `src/app/icon.svg` | `scripts/smoke.mjs`(`/icon.svg` 를 `image/svg+xml` 로 요청) | smoke 실패 |
| `src/fonts/PretendardVariable.woff2` | `src/app/fonts.ts`(`localFont` 의 상대경로 `../fonts/…`) | 빌드 실패 |

- 차단 DB 주소 `postgres://blocked:blocked@127.0.0.1:1/blocked` 는 `with-blocked-db.mjs`, ci.yml, `guard-bash.test.mjs` 에 따로 적혀 있고, `smoke.mjs` 의 로그 분류 정규식(`127\.0\.0\.1:1`)이 이 주소를 전제한다. 문서(CLAUDE.md, database.md, verify 스킬)에도 있다. 바꾸면 모두 바꾼다.
- smoke 의 로그 분류는 `⨯` 로 시작하는 서버 오류 블록만 센다. DB 컴포넌트가 오류를 삼키고 `console.error`(`[views] …`, `[most-read] …`)로 남기는 로그는 세지 않으므로 "DB 접속 실패 로그 0건"도 정상이다.
- `verify.mjs` 단계를 바꾸면 ci.yml 도 같이 바꾼다(CLAUDE.md). 훅을 고치면 `npm run test:hooks` 를 실행한다.
- settings.json 의 allow 규칙은 스크립트 경로를 문자열로 갖는다. 스크립트를 옮기면 allow 도 고친다.
