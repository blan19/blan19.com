# blan19.com

개인 한국어 기술 블로그(https://www.blan19.xyz). `contents/` 의 `.mdx` 글(MDX 가 아니라 마크다운)을 Next.js App Router 로 렌더하고, Postgres 는 글 조회수에만 쓴다. Vercel GitHub 연동으로 배포(브랜치 push → Preview(PR 유무 무관), main → Production). 앱 테스트 코드는 없다(훅과 콘텐츠 검사기 테스트만 있다). 검증은 `npm run verify`.

- 스택: Next.js 16.4 (Turbopack, Cache Components: `cacheComponents: true`, `partialPrefetching: false`), React 19.3, TypeScript 6.0, Tailwind CSS 4.3, Prisma 7.10 (`@prisma/adapter-pg`), ESLint 10 flat config, Node 24 / npm 11. 글 렌더: unified 11(remark-parse, remark-gfm, remark-rehype, `hast-util-to-jsx-runtime`), Shiki 4.5(서버 전용, JS 정규식 엔진, CSS 변수 테마), mermaid 11(클라이언트 지연 로드). 디자인: 회색조 G3 "Minimal Index"(색상 없음, 다크 배경 `#16181b`), 글꼴은 Pretendard(sans) + IBM Plex Mono(메타, 코드) 둘뿐이다(세리프, 도장 없음).
- Next 16 API 가 헷갈리면 학습 데이터 대신 버전이 맞는 로컬 문서를 먼저 본다: `node_modules/next/dist/docs/01-app/`
- Claude Code 전용 프로젝트다. `next.config.js` 의 `agentRules: false` 는 `next dev` 가 `AGENTS.md` 를 만들지 않게 하는 설정이니 지우지 않는다.

## 문서

이 파일은 에이전트 작업 규칙이다. 긴 설명은 다음 문서에 있다.

- 왜 이렇게 만들었는지(결정과 제약): `docs/intent.md`
- 구조(모듈, 데이터 흐름, 렌더 방식): `docs/architecture.md`
- 디자인 값(토큰, 타입 스케일, 레일 그리드, 컴포넌트): `docs/design.md`
- 영역별 규칙: `.claude/rules/`(아래 작업 규칙), 사람용 소개: `README.md`

## 명령어

| 명령 | 하는 일 / 언제 |
|---|---|
| `npm run verify` | 전체 검증(운영 DB 차단, 첫 실패에서 멈춤): prisma generate → tsc → eslint → content:check --strict → test:hooks → test:content → next build → smoke. 코드 변경을 끝내기 전에 실행 |
| `npm run typecheck` | `prisma generate && tsc --noEmit` |
| `npm run lint` | `eslint .` |
| `npm run content:check [파일...]` | `contents/` 구조, frontmatter, 본문 검사. 글을 쓰거나 고친 뒤 실행. `--strict` 는 `TODO:` 를 error 로 본다(verify, CI) |
| `npm test` | `test:hooks` + `test:content` |
| `npm run test:hooks` | `.claude/hooks` 테스트(guard-bash 판정 매트릭스와 post-edit-check). 훅을 고치면 실행 |
| `npm run test:content` | 콘텐츠 검사기(`scripts/content/`) 테스트. 검사 규칙을 고치면 실행 |
| `npm run build` | `prisma generate && next build`. db push 는 없지만 `.env`(운영 DB)를 그대로 읽는다. 에이전트는 `npm run verify` 나 `node scripts/with-blocked-db.mjs next build` 를 쓴다 |
| `npm run smoke` | 기존 `.next` 빌드를 DB 차단 `next start` 로 띄워 `scripts/smoke.mjs` 의 `checks` 를 요청(서버 로그는 `.next/smoke-server.log`). build 다음에 실행 |
| `npm run dev:safe` | DB 차단 dev 서버. 조회수와 홈 "많이 읽힌 글"이 비어 보인다(정상). 화면 확인은 `/run-app` 을 쓴다 |
| `node scripts/with-blocked-db.mjs [--preview] <cmd...>` | 임의 명령을 DB 차단 env 로 실행(예: `... next build`). `--preview` 는 `POSTGRES_URL` 만 비워 DB 를 아예 건너뛴다(조회수 칸과 "많이 읽힌 글"이 빠진 채 글 화면이 정상, /run-app) |
| `npm run dev`, `npm start` | `.env` 의 운영 DB 로 서버를 띄움. 에이전트는 쓰지 않는다(훅이 차단). 필요하면 사용자가 직접 실행한다 |
| `npm run vercel-build` | Vercel 전용(`prisma db push` 포함). 로컬 실행 금지(`node --run vercel-build`, `vercel build` 도 같다) |

CI(`.github/workflows/ci.yml`)는 PR 과 main push 에서 DB 차단 env 로 `npm run verify` 한 단계를 실행한다(`.next/cache` 복원 포함). 검증 단계는 `scripts/verify.mjs` 한 곳에서만 바꾼다.

## 🚨 운영 DB 안전 규칙

`.env` 는 **프로덕션** Postgres(Neon via Vercel)를 가리킨다. 로컬에는 개발용 DB 가 없다.

- `prisma db push`, `prisma db pull`, `prisma migrate *`, `prisma db execute`, `prisma db seed`, `prisma studio`, `npm run vercel-build` 는 실행하지 않는다. 스키마는 Vercel 배포의 `vercel-build` 만 반영한다. 예외는 SQL 미리보기용 `node scripts/with-blocked-db.mjs npx prisma migrate diff --from-schema … --to-schema … --script` 하나다(database.md).
- `prisma/schema.prisma` 변경(커밋 여부 무관)이 있으면 push 하거나 PR 을 만들기 전에 반드시 직접 사용자에게 묻는다(Preview 빌드도 운영 스키마를 바꿀 수 있다. 이유는 database.md). 훅의 확인 창은 보조 수단이다. GitHub MCP 도구로 push/PR 하지 않고, CLI 배포(`vercel`, `vercel deploy`)도 쓰지 않는다.
- `.env` 내용을 출력, 복사, 수정, 삭제하지 않는다. 변수 이름은 코드(`process.env.*`)에서 확인한다. DB 연결 문제를 디버깅할 때도 dotenv 등으로 env 값을 출력하지 말고 사용자에게 확인을 요청한다.
- 실제 DB 로 띄운 서버에 `/tech/<slug>` 를 요청하면 운영 조회수가 올라간다(이미 한 번 사고 났음). 런타임 확인은 `verify`, `smoke`, `dev:safe`, `with-blocked-db.mjs`, `/run-app` 으로만 한다. 차단 주소는 `postgres://blocked:blocked@127.0.0.1:1/blocked`(원본 `scripts/lib/blocked-db.mjs`)이고 process env 가 `.env` 보다 우선한다. 띄운 서버는 끝나기 전에 PID 로 종료한다.
- 훅과 권한이 일부를 강제한다(`.claude/settings.json`): `guard-bash.mjs` 는 위 명령, `.env` 읽기, `vercel --prod`/`build`/`env pull`, DB 차단 없는 `next dev/start`·`npm run dev/start`(`node --run` 포함)를 차단하고, 스키마 변경이 있을 때 `git push`·`gh pr create`·`vercel deploy` 에 확인을 요청한다. 같은 Bash 호출 안의 `cd` 는 `&&` 로 이어 쓸 때만 따라간다(`cd x; grep -r …` 같은 상대 경로 재귀 검색은 막힌다). GitHub MCP 도구 중 권한 `ask` 인 것은 push, 파일 생성·수정·삭제, 브랜치 생성, PR 생성·머지, PR 브랜치 갱신 7개뿐이다(PR 수정, 이슈와 댓글, 리뷰, 저장소 생성·삭제·fork 같은 다른 쓰기 도구는 목록에 없어 권한 모드에 따라 확인 없이 실행될 수 있다). 우회를 모두 막지는 못하므로 위 규칙이 우선이다. 훅에 막히면 우회하지 말고 메시지의 대안을 따른다.
- `npm run build` 는 `.env` 를 읽는다. 정적 셸은 빌드 때 prerender 되고, DB 쿼리는 `connection()` 뒤의 Suspense 구멍(`ArticleViews`, `RowViews`, `MostRead`)에서만 요청 때 돈다(`src/lib/views.ts` 함수도 각자 `connection()` 을 먼저 부른다). 정적 렌더 경로(generateStaticParams, opengraph-image, 정적 셸)에 DB 쿼리를 넣지 않는다. 넣으면 로컬 빌드가 운영 DB 를 읽는다.

## 디렉터리

```
contents/{tech|log}/YYYY-MM-DD/<slug>.mdx   글 (폴더당 .mdx 1개, 파일명 = slug = URL = 조회수 키)
src/app/            라우트와 메타데이터 파일: / /tech /tech/[slug] /log /rss.xml /rss-atom.xml /llms.txt /sitemap.xml /robots.txt, error.tsx, not-found.tsx
                    opengraph-image.tsx(사이트 카드. tech/, log/ 의 것은 re-export), tech/[slug]/opengraph-image.tsx(글 카드)
                    fonts.ts(next/font 2종: Pretendard, IBM Plex Mono), icon.svg(파비콘, 이전 히어로였던 정적 점묘 매듭. 지금 히어로(노트북)와 무관)
src/proxy.ts        목록에 없는 /tech/<slug> 를 루트 404 로 rewrite(slug 목록은 next.config.js 가 빌드 때 env.TECH_SLUGS 로 인라인, dev 는 통과)
src/components/     layouts/{header,footer}, ui/<kebab-name>/index.tsx
src/lib/            posts.ts(contents/ fs 로더, frontmatter 검증), markdown/(글 렌더 파이프라인과 피드 HTML), feed.ts(buildFeed, RSS/Atom),
                    views.ts(조회수: recordView, getViewMap, getMostRead), prisma.ts(클라이언트), config.ts(site, author, comments, analytics),
                    metadata.ts(alternates/openGraph 헬퍼, OG_SIZE), json-ld.ts(홈, 글 JSON-LD), og-image.tsx(OG 카드 렌더), page-ids.ts(글 페이지 고정 DOM id),
                    theme.ts(테마 API, 브라우저 전용), laptop.ts(홈/404 점묘 노트북 기하, 서버·클라이언트 공용),
                    laptop-canvas.ts(홈 히어로 캔버스 엔진, 브라우저 전용), format.ts(날짜, 조회수 표기)
src/fonts/          PretendardVariable.subset.woff2(서브셋, 코드포인트 목록 PretendardVariable.subset.unicodes.txt) + 라이선스(OFL), Pretendard-Bold.woff(OG 폰트, og-image.tsx 가 읽음)
src/styles/         globals.css(토큰, Tailwind 4 매핑, 공용 클래스, 크롬), markdown.css(글 본문), pages.css(페이지). 뒤의 둘은 globals.css 가 import
src/generated/      Prisma 생성 코드 (gitignore)
prisma/             schema.prisma (모델 View 하나)
scripts/            verify, smoke, validate-content(검사 규칙은 content/*.mjs), with-blocked-db, lib/(blocked-db, paths, import-ts)
docs/               intent.md, architecture.md, design.md
.claude/            settings.json, hooks/(guard-bash/, post-edit-check, session-start), rules/, skills/
```

`public/image/<slug>/` 는 로컬 글 이미지다(글에서는 `/image/<slug>/<파일>` 로 쓴다).

## 아키텍처 요점

세부는 `docs/architecture.md`.

- 글 → `src/lib/posts.ts` 가 종류별로 한 번 읽어 인덱스를 만든다(production 은 프로세스당 1번, dev 는 요청당). gray-matter(YAML 만, `---js` 는 throw) 뒤 `parseMetadata` 로 frontmatter 를 검증하고, 구조 오류와 같은 종류 안의 slug 겹침은 파일 경로를 담아 throw 한다(빌드나 첫 요청이 실패한다). `/`, `/tech`, `/tech/[slug]`, `/log`, RSS, `/llms.txt`, sitemap, 글 OG 이미지가 이 결과(`getBlogPosts`, `getPostsNewestFirst`, `getPost`)를 쓴다. 수정일은 frontmatter `updatedAt`(선택) ?? `publishedAt`(`getModifiedAt`)이다. `/log` 는 마크다운 렌더 없이 원문 문단을 출력하고 상세 페이지가 없다.
- 목록 순서는 `publishedAt` 이 아니라 날짜 폴더 이름순이다(`posts.ts` 가 명시적으로 정렬, `getPostsNewestFirst` 는 그 역순).
- 글 본문 → `renderMarkdown(slug, content)`(`src/lib/markdown/index.ts`)가 HAST 를 한 번 만들어 LRU 모듈 캐시(키 `slug:sha1(본문)`, 50개)에 두고, 목차를 같은 트리에서 뽑는다. `ui/post-body` 가 `hast-util-to-jsx-runtime` 으로 렌더한다. 피드 항목 본문은 같은 HAST 를 `src/lib/markdown/feed-html.ts` 가 리더용 HTML 로 바꾼 것이다(`buildFeed`). 세부는 frontend.md.
- OG 이미지는 `app/opengraph-image.tsx`(사이트, `/tech`·`/log` 는 re-export)와 `app/tech/[slug]/opengraph-image.tsx`(글마다, generateStaticParams)가 빌드 때 PNG 로 만든다. canonical, openGraph 는 `src/lib/metadata.ts` 헬퍼로 페이지마다 둔다. 홈과 글은 `ui/json-ld` 로 JSON-LD(`src/lib/json-ld.ts`)를 넣는다.
- 홈의 최근 글과 /tech 목록은 파일시스템만으로 그린다. DB 는 조회수(글 머리 `ArticleViews`, 목록 행 `RowViews`)와 홈 "많이 읽힌 글"(`MostRead` → `getTopViews`: `'use cache: remote'` + `cacheLife('hours')` + `cacheTag('views')`, Vercel 원격 캐시(로컬은 메모리), 배포마다 새로 채움)에만 쓴다.
- DB 는 `View(slug, count)` 하나. `/tech/[slug]` 요청마다 `ArticleViews` 가 `recordView` 의 upsert 를 await 하고 올린 값(이번 방문 포함)을 표시한다. 있는 tech 글만 센다.
- DB 실패는 컴포넌트가 삼킨다: `ui/view-count`, `ui/most-read` 는 쿼리만 try/catch 하고 실패하면 `null` 을 렌더해 그 칸이나 섹션만 사라진다. `app/error.tsx` 로 번지지 않는다.
- 렌더 방식: `/`, `/tech`, `/tech/[slug]` 는 Partial Prerender(정적 셸 + Suspense 구멍. `/tech` 는 searchParams 를 구멍 안에서만 읽고, `/tech/[slug]` 는 generateStaticParams 로 모든 글을 prerender 하며 목록에 없는 slug 는 `src/proxy.ts` 가 루트 404 로 돌린다). 나머지(`/log`, 피드, `/llms.txt`, sitemap, robots, opengraph-image)는 static.
- Cache Components 의 Activity 로 떠난 페이지(최대 3개)가 `display:none` 으로 DOM 에 남는다. id 가 겹칠 수 있으니 클라이언트 DOM 조회는 자기 `.site-wrap` 안으로 한정한다(TocSpy 가 그렇게 한다).
- 홈 소개 옆과 404 의 점묘 노트북(`ui/hero-object`, 404 는 흩어진 분해도)은 서버가 SVG 로 그리고, 홈만 클라이언트 섬 `ui/hero-canvas`(엔진 `src/lib/laptop-canvas.ts`)가 캔버스로 천천히 흔들고 재생 막대를 움직인다. 세부와 규칙은 frontend.md.
- 푸터 연도는 `next.config.js` 의 `env.BUILD_YEAR`(빌드한 해, KST, 빌드 때 인라인)다. 보안 헤더와 Report-Only CSP 도 `next.config.js` 의 `headers()` 에 있다.

## 작업 규칙

- 변경 종류별 검증:
  - TS/TSX 편집: PostToolUse 훅이 그 파일만 ESLint 한다. 마무리 전에 `npm run typecheck`, 끝낼 때 `npm run verify`.
  - `contents/**/*.mdx` 편집: 훅이 자동 검사한다. 마무리 때 `npm run content:check`.
  - `prisma/schema.prisma`, `next.config.js`, `package.json`: `npm run verify`.
  - `.claude/hooks/**`: `npm run test:hooks`. `scripts/content/**`: `npm run test:content`.
- 라우트를 추가하거나 지울 때:
  1. `src/app/<route>/page.tsx`(또는 `route.ts`)를 만든다. Next 16 의 `params`/`searchParams` 는 Promise 다.
  2. `scripts/smoke.mjs` 의 `checks` 에 경로와 기대 content-type(이미지 라우트는 `image/png`)을 넣는다. 넣지 않으면 verify 가 그 라우트를 요청하지 않는다.
  3. 공개 페이지면 `src/app/sitemap.ts` 의 `routes` 에 넣고, metadata 에 `alternates("/<path>")`, `openGraph("/<path>", 제목, 설명)`(`src/lib/metadata.ts`)을 넣고 그 세그먼트에 opengraph-image 를 둔다(루트 것을 re-export). smoke 항목에는 `body: [...head("/<path>"), ...og("/<path>")]` 를 붙인다.
  4. Cache Components 규칙: `<Suspense>` 밖에서 캐시되지 않은 데이터나 런타임 값(cookies, searchParams, `connection()` 뒤 코드)에 접근하면 빌드 오류다. DB 를 읽으면 `<Suspense>` 로 감싸고 쿼리 전에 `await connection()`(`next/server`)을 부른다. `connection()` 은 try 밖에서 부르고, 쿼리만 try/catch 해 catch 첫 줄에서 `unstable_rethrow(error)`(`next/navigation`) 후 `null` 을 렌더한다(`ui/view-count`, `ui/most-read` 패턴). `'use cache'` 스코프 안에서는 `connection()` 을 부를 수 없으니 그 바깥에서 부른다.
     - `export const dynamic|revalidate|dynamicParams|runtime` 를 쓰지 않는다(Cache Components 에서 빌드 실패).
     - prerender 경로에서 `new Date()`, `Date.now()`, `Math.random()` 을 쓰지 않는다.
     - `generateStaticParams` 는 1개 이상 반환해야 한다.
  5. `npm run verify` 를 실행한다.
- `@/generated/prisma/client` 가 없다는 tsc 오류는 `npx prisma generate` 로 해결한다(DB 접속 없음). npm 11 에서도 자동 generate 는 없다.
- 영역별 세부 규칙과 알려진 이슈는 해당 파일을 열 때 `.claude/rules/` 에서 자동 로드된다: content.md(글), frontend.md(Tailwind 4, 토큰, 테마, 폰트, 글 렌더러, 히어로 오브젝트, Next 16), database.md(Prisma, 조회수, 스키마 변경), tooling.md(scripts, hooks, settings, CI 의 하드코딩 경로).

## 코드 컨벤션

- 큰따옴표, 2칸 들여쓰기, 세미콜론, trailing comma (Prettier 설정 없음, 주변 코드에 맞춤).
- 컴포넌트: `src/components/ui/<kebab>/index.tsx`, 화살표 함수 + 파일 끝 `export default X`, 타입은 `import type`. props 는 `interface XProps` 가 많다(예외 있음).
- layout, error, not-found, robots, sitemap, 홈 page, 루트 `opengraph-image` 는 `export default function`, 나머지 page 와 `tech/[slug]/opengraph-image` 는 화살표 함수 + 파일 끝 `export default`. 둘 다 허용하며 같은 폴더의 기존 파일에 맞춘다. route handler 는 `export async function GET`, 데이터 모듈은 named export.
- 새 코드의 import 는 `@/*` (→ `src/*`) 별칭을 쓴다. 예외: 검사기가 Node 타입 제거로 직접 읽는 `languages.ts`, `image-meta.ts`, `page-ids.ts` 는 import 를 두지 않는다(tooling.md).
- 서버 전용 모듈(`src/lib/posts.ts`, `views.ts`, `prisma.ts`, `feed.ts`, `og-image.tsx`, `markdown/index.ts`, `markdown/shiki.ts`, `markdown/feed-html.ts`, `markdown/code/highlight.ts`)은 첫 줄에 `import "server-only";` 를 둔다(패키지 설치 없이 Next 가 처리한다).

## 커밋 / PR

- 메시지: `feat: …`, `fix: …`, `chore: …`, `style: …`, `docs: …`, `refactor: …`. 새 글은 `contents: <slug>`, 글 수정은 `contents: update <slug>`.
- 브랜치는 main 에서 만든다. 그 밖의 git/PR 규칙은 전역 `~/.claude/CLAUDE.md` 를 따른다.

## 알려진 이슈 (요청 없이 고치지 말 것)

고치는 게 작업이면 먼저 사용자와 범위를 맞춘다. 영역별 이슈는 각 rule 파일에 있다.

- slug 를 바꾸거나 글을 지우면 조회수와 댓글 연결이 끊긴다. DB 에 행만 남은 slug 는 홈 "많이 읽힌 글"에서 빠지므로(상위 3개를 가져온 뒤 거른다) 3개보다 적게 보일 수 있다.

## 스킬

- `/new-post`: 새 글 작성(폴더, slug, frontmatter, 초안, 검사).
- `/verify`: 변경 검증과 결과 보고.
- `/run-app`: 앱을 DB 차단 상태로 띄워 화면 확인과 스크린샷.
