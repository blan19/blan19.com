# blan19.com

개인 한국어 기술 블로그(https://www.blan19.com). `contents/` 의 MDX 글을 Next.js App Router 로 렌더하고, Postgres 는 글 조회수에만 쓴다. Vercel GitHub 연동으로 배포(브랜치 push → Preview(PR 유무 무관), main → Production). 앱 테스트 코드는 없다(훅 테스트만 있다). 검증은 `npm run verify`.

- 스택: Next.js 16.4 (Turbopack), React 19.3, TypeScript 6.0, Tailwind CSS 4.3, Prisma 7.10 (`@prisma/adapter-pg`), ESLint 10 flat config, Node 24 / npm 11.
- Next 16 API 가 헷갈리면 학습 데이터 대신 버전이 맞는 로컬 문서를 먼저 본다: `node_modules/next/dist/docs/01-app/`
- Claude Code 전용 프로젝트다. `next.config.js` 의 `agentRules: false` 는 `next dev` 가 `AGENTS.md` 를 만들지 않게 하는 설정이니 지우지 않는다.

## 명령어

| 명령 | 하는 일 / 언제 |
|---|---|
| `npm run verify` | 전체 검증(운영 DB 차단): prisma generate → tsc → eslint → content:check → next build → smoke. 코드 변경을 끝내기 전에 실행 |
| `npm run typecheck` | `prisma generate && tsc --noEmit` |
| `npm run lint` | `eslint .` |
| `npm run content:check [파일...]` | `contents/` 구조, frontmatter, 본문 검사. 글을 쓰거나 고친 뒤 실행 |
| `npm run build` | `prisma generate && next build`. db push 는 없지만 `.env`(운영 DB)를 그대로 읽는다. 에이전트는 `npm run verify` 나 `node scripts/with-blocked-db.mjs next build` 를 쓴다 |
| `npm run test:hooks` | `.claude/hooks` 테스트(guard-bash 판정 매트릭스, post-edit-check). 훅을 고치면 test:hooks 실행 |
| `npm run smoke` | 기존 `.next` 빌드를 DB 차단 `next start` 로 띄워 `scripts/smoke.mjs` 의 라우트 목록을 요청. build 다음에 실행 |
| `npm run dev:safe` | DB 차단 dev 서버. `/`, `/tech`, `/tech/<slug>` 는 로드 직후 에러 화면으로 바뀐다(정상). 화면 확인은 `/run-app` 을 쓴다 |
| `node scripts/with-blocked-db.mjs [--preview] <cmd...>` | 임의 명령을 DB 차단 env 로 실행(예: `... next build`). `--preview` 는 `POSTGRES_URL` 만 비워 글 화면을 정상으로 보이게 한다(/run-app) |
| `npm run dev`, `npm start` | `.env` 의 운영 DB 로 서버를 띄움. 에이전트는 쓰지 않는다(훅이 차단). 필요하면 사용자가 직접 실행한다 |
| `npm run vercel-build` | Vercel 전용(`prisma db push` 포함). 로컬 실행 금지(`node --run vercel-build`, `vercel build` 도 같다) |

CI(`.github/workflows/ci.yml`)는 PR 과 main push 에서 verify 와 같은 단계와 test:hooks 를 DB 차단 env 로 따로 나열해 실행한다. `scripts/verify.mjs` 의 단계를 바꾸면 ci.yml 도 같이 바꾼다.

## 🚨 운영 DB 안전 규칙

`.env` 는 **프로덕션** Postgres(Neon via Vercel)를 가리킨다. 로컬에는 개발용 DB 가 없다.

- `prisma db push`, `prisma db pull`, `prisma migrate *`, `prisma db execute`, `prisma db seed`, `prisma studio`, `npm run vercel-build` 는 실행하지 않는다. 스키마는 Vercel 배포의 `vercel-build` 만 반영한다. 예외는 SQL 미리보기용 `node scripts/with-blocked-db.mjs npx prisma migrate diff --from-schema … --to-schema … --script` 하나다(database.md).
- `prisma/schema.prisma` 변경(커밋 여부 무관)이 있으면 push 하거나 PR 을 만들기 전에 반드시 직접 사용자에게 묻는다(Preview 빌드도 운영 스키마를 바꿀 수 있다. 이유는 database.md). 훅의 확인 창은 보조 수단이다. GitHub MCP 도구로 push/PR 하지 않고, CLI 배포(`vercel`, `vercel deploy`)도 쓰지 않는다.
- `.env` 내용을 출력, 복사, 수정, 삭제하지 않는다. 변수 이름은 코드(`process.env.*`)에서 확인한다. DB 연결 문제를 디버깅할 때도 dotenv 등으로 env 값을 출력하지 말고 사용자에게 확인을 요청한다.
- 실제 DB 로 띄운 서버에 `/tech/<slug>` 를 요청하면 운영 조회수가 올라간다(이미 한 번 사고 났음). 런타임 확인은 `verify`, `smoke`, `dev:safe`, `with-blocked-db.mjs`, `/run-app` 으로만 한다. 차단 주소는 `postgres://blocked:blocked@127.0.0.1:1/blocked` 이고 process env 가 `.env` 보다 우선한다. 띄운 서버는 끝나기 전에 PID 로 종료한다.
- 훅과 권한이 일부를 강제한다(`.claude/settings.json`): `guard-bash.mjs` 는 위 명령, `.env` 읽기, `vercel --prod`/`build`/`env pull`, DB 차단 없는 `next dev/start`·`npm run dev/start`(`node --run` 포함)를 차단하고, 스키마 변경이 있을 때 `git push`·`gh pr create`·`vercel deploy` 에 확인을 요청한다. GitHub MCP 쓰기 도구는 권한 `ask` 다. 우회를 모두 막지는 못하므로 위 규칙이 우선이다. 훅에 막히면 우회하지 말고 메시지의 대안을 따른다.
- `npm run build` 는 `.env` 를 읽는다. 지금은 DB 를 쓰는 라우트가 모두 dynamic 이라 빌드 중 쿼리가 없다. 정적 렌더 경로(generateStaticParams, 정적 page)에 DB 쿼리를 넣지 않는다. 넣으면 로컬 빌드가 운영 DB 를 읽는다.

## 디렉터리

```
contents/{tech|log}/YYYY-MM-DD/<slug>.mdx   글 (폴더당 .mdx 1개, 파일명 = slug = URL = 조회수 키)
src/app/            라우트: / /tech /tech/[slug] /log /og /rss.xml /rss-atom.xml /sitemap.xml /robots.txt
src/app/db/         blog.ts(fs 로더), action.ts(increment, 쓰기), queries.ts(조회). 라우트 아님
src/components/     layouts/{header,footer}, ui/<kebab-name>/index.tsx
src/lib/            prisma.ts(클라이언트), config.ts(RSS 작성자, 사이트 URL)
src/utils/          formatDate.ts, generateSlug.ts(미사용)
src/styles/         globals.css (Tailwind 4 테마와 MDX 스타일)
src/generated/      Prisma 생성 코드 (gitignore)
prisma/             schema.prisma (모델 View 하나)
scripts/            verify, smoke, validate-content, with-blocked-db
.claude/            settings.json, hooks/, rules/, skills/
```

## 아키텍처 요점

- 글 → `getBlogPosts("tech"|"log")`(`src/app/db/blog.ts`)가 fs 로 읽고 gray-matter 로 frontmatter 를 파싱한다(검증 없음). `/`, `/tech`, `/tech/[slug]`, `/log`, RSS, sitemap 이 이 결과를 쓴다. `/og` 는 쿼리의 `title` 만 읽는다(URL 은 `tech/[slug]` 의 `generateMetadata` 가 만든다). `/log` 는 MDX 렌더 없이 원문을 출력하고 상세 페이지가 없다.
- 목록 순서는 `publishedAt` 이 아니다. `blog.ts` 에 정렬 코드가 없어 `readdirSync` 가 돌려주는 날짜 폴더 순서(현재 이름순)를 페이지가 `.reverse()` 한다.
- DB 는 `View(slug, count)` 하나. `/tech/[slug]` 렌더 때마다 `increment` 가 upsert 한다. 홈의 최근/인기 목록은 `unstable_cache`(1시간)로 View 테이블을 읽는다.
- `/`, `/tech`, `/tech/[slug]`, `/og` 는 dynamic, 나머지는 static.

## 작업 규칙

- 변경 종류별 검증:
  - TS/TSX 편집: PostToolUse 훅이 그 파일만 ESLint 한다. 마무리 전에 `npm run typecheck`, 끝낼 때 `npm run verify`.
  - `contents/**/*.mdx` 편집: 훅이 자동 검사한다. 마무리 때 `npm run content:check`.
  - `prisma/schema.prisma`, `next.config.js`, `package.json`: `npm run verify`.
- 라우트를 추가하거나 지울 때:
  1. `src/app/<route>/page.tsx`(또는 `route.ts`)를 만든다. Next 16 의 `params`/`searchParams` 는 Promise 다.
  2. `scripts/smoke.mjs` 의 `checks` 에 경로와 기대 content-type 을 넣는다. 넣지 않으면 verify 가 그 라우트를 요청하지 않는다.
  3. 공개 페이지면 `src/app/sitemap.ts` 의 `routes` 에 넣는다.
  4. DB 를 읽으면 `<Suspense>` 로 감싸고, 쿼리 전에 `await connection()`(`next/server`)을 호출해 dynamic 으로 둔다. `unstable_cache` 안에서 부르면 오류가 나니 그 바깥(컴포넌트)에서 부른다. 빠뜨리면 빌드가 prerender 하며 쿼리를 실행한다(기존 코드의 `unstable_noStore()` 도 같은 역할).
  5. `npm run verify` 를 실행한다.
- `@/generated/prisma/client` 가 없다는 tsc 오류는 `npx prisma generate` 로 해결한다(DB 접속 없음). npm 11 에서도 자동 generate 는 없다.
- 영역별 세부 규칙과 알려진 이슈는 해당 파일을 열 때 `.claude/rules/` 에서 자동 로드된다: content.md(글), frontend.md(Tailwind 4, Next 16, MDX 렌더러), database.md(Prisma, 스키마 변경).

## 코드 컨벤션

- 큰따옴표, 2칸 들여쓰기, 세미콜론, trailing comma (Prettier 설정 없음, 주변 코드에 맞춤).
- 컴포넌트: `src/components/ui/<kebab>/index.tsx`, 화살표 함수 + 파일 끝 `export default X`, 타입은 `import type`. props 는 `interface XProps` 가 많다(예외 있음).
- layout, error, robots, sitemap, 홈 page 는 `export default function`, 나머지 page 는 화살표 함수 + 파일 끝 `export default`. 둘 다 허용하며 같은 폴더의 기존 파일에 맞춘다. route handler 는 `export async function GET`, 데이터 모듈은 named export.
- 새 코드의 import 는 `@/*` (→ `src/*`) 별칭을 쓴다(RSS route 두 곳에 상대경로가 남아 있다).

## 커밋 / PR

- 메시지: `feat: …`, `fix: …`, `chore: …`, `style: …`, `docs: …`. 새 글은 `contents: <slug>`, 글 수정은 `contents: update <slug>`.
- 브랜치는 main 에서 만든다. 그 밖의 git/PR 규칙은 전역 `~/.claude/CLAUDE.md` 를 따른다.

## 알려진 이슈 (요청 없이 고치지 말 것)

고치는 게 작업이면 먼저 사용자와 범위를 맞춘다. 영역별 이슈는 각 rule 파일에 있다.

- slug 를 바꾸거나 글을 지우면 조회수 연결이 끊긴다. DB 에 행만 남은 slug 는 홈의 최근/인기 목록에서 빠지므로(상위 3개를 가져온 뒤 거른다) 목록이 3개보다 적게 보일 수 있다.
- `unstable_cache`, `unstable_noStore` 는 Next 16 에서 레거시 API 다. 마이그레이션은 별도 작업으로 다룬다.

## 스킬

- `/new-post`: 새 글 작성(폴더, slug, frontmatter, 초안, 검사).
- `/verify`: 변경 검증과 결과 보고.
- `/run-app`: 앱을 DB 차단 상태로 띄워 화면 확인과 스크린샷.
