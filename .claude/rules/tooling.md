---
paths:
  - "scripts/**"
  - ".claude/hooks/**"
  - ".claude/settings.json"
  - ".github/**"
  - "package.json"
---

# 도구(scripts, hooks, settings, CI) 규칙

운영 DB 안전 규칙과 명령 표는 CLAUDE.md 를 따른다. 이 파일은 도구 구성과, 파일을 옮기거나 이름을 바꿀 때 같이 고쳐야 하는 하드코딩 경로 목록이다. 대부분은 verify 나 훅이 실패해 드러나지만, "조용히" 로 적은 항목은 오류 없이 동작이 바뀌어 검사로 잡히지 않는다.

## 구성

- `scripts/verify.mjs` 가 검증의 단일 진입점이다(로컬과 CI 가 같은 것을 실행). 단계는 이 파일에서만 바꾼다. ci.yml 은 DB 차단 env 와 `.next/cache` 복원 뒤 `npm run verify` 한 단계다.
- `scripts/validate-content.mjs` 는 CLI(`--strict`, `--root`, 파일 인자)이고 규칙은 `scripts/content/*.mjs`(scan, frontmatter, body, images, context, problem)에 있다. 테스트는 `scripts/content/validate-content.test.mjs`(`npm run test:content`).
- `scripts/lib/`: `blocked-db.mjs`(차단 주소와 `blockedEnv()` 의 단일 원본), `paths.mjs`(`ROOT`, `resolveBin`), `import-ts.mjs`(`importTs`, Node 타입 제거로 `.ts` 를 import).
- `.claude/hooks/guard-bash.mjs`(stdin/exit code 계약. 판정 모듈을 못 불러오면 모든 명령을 막는다) → `guard-bash/lex.mjs`(셸 토크나이저) → `guard-bash/rules.mjs`(`analyze(command, { projectDir })`, 명령별 핸들러). 판정을 고치면 `guard-bash.test.mjs` 에 케이스를 넣고 `npm run test:hooks` 를 실행한다. `rules.mjs` 의 vercel 하위 명령 차단 목록은 `settings.json` 의 deny 와 맞춘다.
- `.claude/hooks/post-edit-check.mjs`: 코드 파일(`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`. scripts 와 훅 자신도 포함)은 그 파일만 ESLint(제외 대상은 `eslint.config.mjs` 의 ignore 를 따름), `contents/**/*.mdx` 는 검사기를 실행한다. `session-start.mjs` 는 상태 표시.
- `.github/dependabot.yml` 은 GitHub Actions 만 갱신한다. npm 은 Preview 빌드의 `vercel-build`(prisma db push)가 운영 DB 를 탈 수 있어 넣지 않았다(Preview DB 분리나 dependabot 브랜치 빌드 제외가 먼저이고 사용자 확인이 필요하다).

## 경로 결합

| 경로 | 쓰는 곳 | 틀어지면 |
|---|---|---|
| `src/lib/markdown/languages.ts`, `image-meta.ts`, `src/lib/page-ids.ts` | 검사기 `scripts/content/context.mjs`(languages), `images.mjs`(`parseImageMeta`), `body.mjs`(`PAGE_IDS`)가 `importTs` 로 import 한다. 대상 파일은 import 없음(타입 import 포함), erasable TS 만, `server-only` 금지 | 경로가 바뀌거나 import·비 erasable 문법이 들어가면 content:check 가 error. `CODE_LANGUAGES` 와 `src/lib/markdown/shiki.ts` 의 `LANG_LOADERS` 키가 어긋나면 tsc 가 실패한다(`satisfies`). import 경로의 파일명 오타는 tsc 가 못 잡는다 |
| 글 페이지 고정 id(원본 `src/lib/page-ids.ts` 의 `PAGE_IDS`. layout, post-header, post-body, post-references, comment, toc-spy 가 import. `footnote-label` 은 remark-rehype 가 고정으로 단다) | `scripts/content/body.mjs` 의 `FIXED_PAGE_IDS`(같은 값을 importTs 로 읽음, 제목 slug 와 겹치면 warn). 검사기의 `github-slugger`(devDependency)는 `rehype-slug` 가 쓰는 것과 같은 2.x 다 | 조용히: 새 고정 id 를 `page-ids.ts` 밖에 하드코딩하면 겹치는 제목을 못 잡는다. `rehype-slug` 가 slugger 를 바꾸면 검사기 slug 가 렌더러와 어긋난다 |
| 콜아웃 타입(원본 `src/lib/markdown/types.ts` 의 `CALLOUT_TYPES`) | `scripts/content/body.mjs` 의 `CALLOUT_TYPES`(따로 적은 사본) | 조용히: 한쪽만 바꾸면 검사기 warn 과 렌더 결과가 어긋난다 |
| `next.config.js` | `scripts/content/context.mjs`(`require` 로 `images.remotePatterns` 의 hostname, pathname, search 를 읽어 Next 와 같은 규칙으로 판정), ci.yml 캐시 키. 보안 헤더와 CSP(`headers()`, Report-Only 는 보고 엔드포인트 없음, 수동 점검 절차는 파일 주석), `env.BUILD_YEAR`(푸터), `env.TECH_SLUGS`(설정 로드 때 `contents/tech` 를 읽어 인라인한 slug 목록, `src/proxy.ts` 가 없는 slug 를 루트 404 로 rewrite 할 때 쓴다)도 여기 있다 | 읽지 못하면 대상 파일과 무관하게 content:check 가 error |
| `contents/` | `post-edit-check.mjs`(`.mdx` 검사 대상 접두어), 검사기, `smoke.mjs`(`contents/tech` 에서 slug 선택), `next.config.js`(`techSlugs()` 가 `contents/tech` 를 readdirSync 해 `env.TECH_SLUGS` 로 인라인), `guard-bash.test.mjs`, ci.yml 캐시 키 | `contents/tech` 가 없으면 설정 로드가 실패해 next build/dev/start 와 content:check(`next.config.js 를 읽지 못함`)가 모두 실패. smoke 도 실패. 훅의 글 검사는 조용히 빠짐 |
| `scripts/validate-content.mjs` | `post-edit-check.mjs`, `verify.mjs`, `package.json`, settings.json allow | 훅 실패 |
| `scripts/with-blocked-db.mjs` | `guard-bash/rules.mjs`(해석한 경로가 프로젝트 또는 같은 저장소 git worktree 의 `scripts/with-blocked-db.mjs` 일 때만 DB 차단 실행으로 인정. 작업 디렉터리를 모르면 상대 경로는 믿지 않음), `package.json`(`dev:safe`), settings.json allow, skills | 차단 실행이 거부되거나 권한 확인이 늘어남 |
| `scripts/lib/blocked-db.mjs` | `with-blocked-db.mjs`, `verify.mjs`, `smoke.mjs`, `guard-bash.test.mjs`(import) | verify, smoke, test:hooks 실패 |
| `prisma/schema.prisma` | `guard-bash/rules.mjs`(push/PR 확인 조건) | 스키마 변경 push 확인이 사라짐 |
| `src/generated/prisma` | `session-start.mjs`, eslint ignore, `.gitignore`, schema.prisma output | 상태 표시와 lint 대상이 틀어짐 |
| `src/fonts/Pretendard-Bold.woff` | `src/lib/og-image.tsx`(`process.cwd()` 기준 `readFile`, 모듈 스코프) | smoke 의 `/opengraph-image`, `/tech/opengraph-image`, `/log/opengraph-image`, `/tech/<slug>/opengraph-image` 실패. 옮기면 새 위치가 `.next/server/app/**/opengraph-image*.nft.json` 에 잡히는지 확인한다(안 잡히면 Vercel 에서만 실패) |
| `src/app/icon.svg` | `scripts/smoke.mjs`(`/icon.svg` 를 `image/svg+xml` 로 요청) | smoke 실패 |
| `src/fonts/PretendardVariable.subset.woff2` | `src/app/fonts.ts`(`localFont` 의 상대경로 `../fonts/…`) | 빌드 실패 |

## 차단 주소와 smoke

- 차단 DB 주소 `postgres://blocked:blocked@127.0.0.1:1/blocked` 의 원본은 `scripts/lib/blocked-db.mjs` 다. `smoke.mjs` 의 로그 분류 정규식도 여기서 만든다. 손으로 맞춰야 하는 곳은 ci.yml 의 env 블록(YAML 이라 import 불가)과 문서뿐이다: 전체 주소는 CLAUDE.md, `docs/intent.md`, 이 파일에, 호스트(`127.0.0.1:1`)만 database.md 와 verify 스킬에 있다.
- smoke 는 `checks` 를 요청한다: `/`, `/tech`, `/tech?tag=react.js`, `/tech?tag=__none__`, `/log`, 모든 tech 글, 없는 글 `/tech/__smoke-not-found__`(404, 본문에 `lang="ko"` 와 not-found 제목), 피드 2개, sitemap, robots, opengraph-image 5개(사이트, `/tech`, `/log`, 첫 글, 없는 slug 404), `/icon.svg`, 없는 경로(404, 본문 검사 같음). tech 글 7개 기준 24개다. 새 라우트는 여기에 넣어야 검사된다.
- smoke 의 로그 분류는 `⨯` 로 시작하는 서버 오류 블록만 센다. 차단 주소 접속 실패(P1001 등) 블록은 정상으로 세고, 그 밖의 블록이 있으면 실패다. 조회수 실패는 `⨯` 블록이 아니라 `console.error` 로만 남아 세지 않는다: `ArticleViews` 는 `[views] 조회수를 기록하지 못했습니다` 를 남기고 null, `getViewMap` 은 `[views] 조회수를 불러오지 못했습니다` 를 요청당 한 번 남기고 다시 던지며, 그것을 받은 `RowViews` 가 로그 없이 삼킨다. `getTopViews`(`'use cache: remote'`)의 실패는 `[most-read]` 한 줄(원래 Prisma 오류)과 Next 의 `⨯` 블록 1건으로 남으므로 "DB 접속 실패 로그 1건"이 정상이다.
- 서버 로그는 `.next/smoke-server.log` 에 남는다(성공, 실패 무관. 출력의 `[smoke] 서버 로그:` 줄).
- settings.json 의 allow 규칙은 스크립트 경로를 문자열로 갖는다. 스크립트를 옮기면 allow 도 고친다.
