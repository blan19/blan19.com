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
| `src/lib/markdown/languages.ts`, `image-meta.ts`, `src/lib/page-ids.ts` | 검사기 `scripts/content/context.mjs`(languages), `images.mjs`(`parseImageMeta`), `body.mjs`(`PAGE_IDS`)가 `scripts/lib/import-ts.mjs` 의 `importTs`(Node 타입 제거)로 import 한다. 대상 파일은 import 없음, erasable TS 만, `server-only` 금지 | 경로가 바뀌거나 import·비 erasable 문법이 들어가면 content:check 가 error. 배열 항목만 바꾸고 `src/lib/markdown/shiki.ts` 의 `langs` import 목록을 안 바꾸면 검사는 통과하지만 그 언어는 렌더 때 하이라이트 실패 |
| 글 페이지 고정 id(원본 `src/lib/page-ids.ts` 의 `PAGE_IDS`. layout, post-header, post-body, post-references, comment, toc-spy 가 import. `footnote-label` 은 remark-rehype 가 고정으로 단다) | `scripts/content/body.mjs` 의 `FIXED_PAGE_IDS`(같은 값을 importTs 로 읽음, 제목 slug 와 겹치면 warn). `github-slugger` 는 `rehype-slug` 의 의존성(직접 의존성 아님)을 그대로 import 한다 | 조용히: 새 고정 id 를 `page-ids.ts` 밖에 하드코딩하면 겹치는 제목을 못 잡는다. `rehype-slug` 가 slugger 를 바꾸면 검사기 slug 가 렌더러와 어긋난다 |
| `next.config.js` | `validate-content.mjs`(`require` 로 `images.remotePatterns`), ci.yml 캐시 키 | 허용 호스트가 `[]` 가 되어 원격 이미지가 모두 error |
| `contents/` | `post-edit-check.mjs`(`.mdx` 검사 대상 접두어), `validate-content.mjs`, `smoke.mjs`(`contents/tech` 에서 slug 선택), `src/lib/posts.ts`(`process.cwd()` 기준. `/og` 의 제목 허용 목록도 이것을 읽는다), `guard-bash.test.mjs`(픽스처), ci.yml 캐시 키 | content:check 와 smoke 실패. 훅의 글 검사는 조용히 빠짐 |
| `scripts/validate-content.mjs` | `post-edit-check.mjs`, `verify.mjs`, `package.json`, settings.json allow | 훅 실패 |
| `scripts/with-blocked-db.mjs` | `guard-bash.mjs`(basename `with-blocked-db.mjs` 로 DB 차단 실행을 허용), `verify.mjs`·`smoke.mjs`(import), `package.json`(`dev:safe`), ci.yml, settings.json allow, skills | 차단 실행이 거부되거나 권한 확인이 늘어남 |
| `prisma/schema.prisma` | `guard-bash.mjs`(push/PR 확인 조건) | 스키마 변경 push 확인이 사라짐 |
| `src/generated/prisma` | `session-start.mjs`, `post-edit-check.mjs`(SKIP_DIRS), eslint ignore, `.gitignore`, schema.prisma output | 상태 표시와 lint 대상이 틀어짐 |
| `src/app/og/Pretendard-Bold.woff` | `src/app/og/route.tsx`(`process.cwd()` 기준 `readFile`) | smoke 의 `/og` 실패. 경로를 고쳐도 새 위치가 Vercel 파일 트레이싱에 안 잡히면 운영에서만 실패 |
| `src/app/icon.svg` | `scripts/smoke.mjs`(`/icon.svg` 를 `image/svg+xml` 로 요청) | smoke 실패 |
| `src/fonts/PretendardVariable.subset.woff2` | `src/app/fonts.ts`(`localFont` 의 상대경로 `../fonts/…`) | 빌드 실패 |

- 사이트 URL(`src/lib/config.ts` 의 `url`)은 `scripts/smoke.mjs` 의 `SITE` 와 og:image 정규식에도 있다. 도메인을 바꾸면 모두 바꾼다(안 바꾸면 smoke 실패).
- smoke 의 `checks` 항목: `path`, `type`(content-type 정규식), `status`(기본 200), `body`(있어야 하는 패턴), `notBody`(있으면 안 되는 패턴), `assert(body)`(문제를 문자열로 돌려주는 함수, 통과면 `null`). HTML 페이지는 `head(path)`(canonical + RSS 링크), `og(path)`(og:site_name·locale·url·image·image:width, twitter:card), `title(text)`(`<title>` 전체 문자열)로 메타를 본다. 글은 `postGraph`(JSON-LD `@graph` 파싱, BlogPosting·BreadcrumbList·WebSite·Person, dateModified), 404 는 제목과 robots 메타가 하나(Next 의 noindex)뿐인지, robots.txt 는 `Allow: /` 와 `Host:` 없음, `/llms.txt` 는 제목 줄과 글 링크를 본다. `config.site.name`("blan19 기술 블로그"), 페이지 제목("글 목록", "기록", "페이지를 찾을 수 없습니다"), title template(`%s | blan19`)이 문자열로 들어 있으니 바꾸면 smoke 도 고친다.
- 차단 DB 주소 `postgres://blocked:blocked@127.0.0.1:1/blocked` 는 `with-blocked-db.mjs`, ci.yml, `guard-bash.test.mjs` 에 따로 적혀 있고, `smoke.mjs` 의 로그 분류 정규식(`127\.0\.0\.1:1`)이 이 주소를 전제한다. 문서(CLAUDE.md, database.md, verify 스킬)에도 있다. 바꾸면 모두 바꾼다.
- smoke 의 로그 분류는 `⨯` 로 시작하는 서버 오류 블록만 센다. DB 컴포넌트가 오류를 삼키고 `console.error`(`[views] …`, `[most-read] …`)로 남기는 로그는 세지 않으므로 "DB 접속 실패 로그 0건"도 정상이다.
- `verify.mjs` 단계를 바꾸면 ci.yml 도 같이 바꾼다(CLAUDE.md). 훅을 고치면 `npm run test:hooks` 를 실행한다.
- settings.json 의 allow 규칙은 스크립트 경로를 문자열로 갖는다. 스크립트를 옮기면 allow 도 고친다.
