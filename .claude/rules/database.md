---
paths:
  - "prisma/**"
  - "prisma.config.ts"
  - "src/lib/prisma.ts"
  - "src/lib/views.ts"
---

# DB / Prisma 7 규칙

운영 DB 안전 규칙과 금지 명령은 CLAUDE.md 를 따른다. 이 파일은 그 밖의 DB 세부다.

## 구성

- `prisma/schema.prisma`: generator `prisma-client`, output `../src/generated/prisma`(gitignore 대상). datasource 에 url 이 없고 `prisma.config.ts` 가 `dotenv/config` 를 로드해 `process.env.POSTGRES_URL_NON_POOLING` 을 CLI 용으로 넘긴다. Prisma 의 `env("…")` 헬퍼로 바꾸지 않는다(`.env` 나 변수가 없는 환경, 예를 들어 새 클론에서 generate 가 실패한다).
- 런타임 클라이언트 `src/lib/prisma.ts`: `PrismaClient({ adapter: new PrismaPg({ connectionString: POSTGRES_PRISMA_URL, ssl: true }) })`. development 에서만 `global.prisma` 로 캐시한다. URL 에 `sslmode` 가 없으면 TLS 로 접속한다(URL 의 `sslmode` 가 `ssl: true` 보다 우선).
- import 경로는 `@/generated/prisma/client` 다. `@prisma/client` 에서 import 하지 않는다.
- 모델은 `View { id, slug @unique, count, createAt, updatedAt }` 하나다. 필드 이름은 `createAt` 이다(오타지만 운영 컬럼명이므로 바꾸지 않는다).

## 조회수 모듈 (`src/lib/views.ts`)

View 테이블 읽기와 쓰기는 이 파일만 한다. `server-only` 모듈이고 `"use server"` 가 아니라 Server Action 으로 노출되지 않는다. 세 함수 모두 먼저 `await connection()` 을 불러(호출부가 빠뜨려도) prerender 를 거기서 멈추므로 `next build` 중에는 쿼리하지 않는다. `POSTGRES_URL` 이 비어 있으면(`hasDatabase()` 가 false, `with-blocked-db.mjs --preview`) 읽기와 쓰기 모두 DB 를 건드리지 않는다. 연결은 `POSTGRES_PRISMA_URL` 로 한다.

| 함수 | 동작 | 캐시 | 부르는 곳 |
|---|---|---|---|
| `recordView(slug)` | **쓰기**: `getPost("tech", slug)` 가 있는 글만 upsert(create `count: 1` / update `increment: 1`, `select: count`) 후 올린 값을 돌려준다(왕복 1회). DB 없음이나 없는 글이면 null | React `cache`(요청당 1번) | `ui/view-count` 의 `ArticleViews`(글 머리, 이번 방문 포함 값 표시) |
| `getViewMap()` | findMany(slug, count) → `Map`. 실패는 여기서 요청당 한 번 `[views]` 로그 후 다시 던진다. DB 없음이면 null | React `cache`(요청당 쿼리 1번) | `ui/view-count` 의 `RowViews`(홈, /tech 목록 행, 로그 없이 null) |
| `getMostRead(n)` | `getTopViews(n)`(count desc) 결과를 글과 조인. DB 에만 남은 slug 는 빠진다. DB 없음이면 `[]` | `getTopViews` 가 `'use cache: remote'` + `cacheLife("hours")` + `cacheTag("views")`(slug, count 만 캐시) | `ui/most-read` 의 `MostRead`(홈 "많이 읽힌 글") |

- DB 쓰기는 `/tech/[slug]` 요청 때 `ArticleViews` 가 `recordView` 를 await 하는 것 하나뿐이다(서버리스에서 응답 뒤 유실되지 않게). 실제 DB 로 띄운 서버에 이 경로를 요청하면 운영 조회수가 오른다.
- `getTopViews` 의 원격 캐시는 Vercel 이 핸들러를 제공해 인스턴스끼리 나눠 쓴다(로컬 `next start` 는 메모리). 배포 사이에는 유지되지 않아 배포마다 첫 요청이 새로 조회한다. `revalidateTag("views")` 로 비울 수 있지만 지금 부르는 곳은 없다. 캐시 경계를 넘은 오류는 production 에서 메시지가 가려지므로 `getTopViews` 안에서 원래 오류를 `[most-read]` 로 로그하고 다시 던진다(`MostRead` 는 로그하지 않는다. 오류는 캐시되지 않는다).
- 오류 격리: DB 를 읽는 컴포넌트는 `<Suspense>` 안에서만 쓰고, `await connection()` 을 try 밖에서 부른 뒤 쿼리만 try/catch 한다. catch 첫 줄에서 `unstable_rethrow(error)`(Next 16.4 의 prerender 중단, hanging-promise 신호를 다시 던짐) 후 `null` 을 렌더한다. 그래서 DB 가 실패해도 조회수 칸이나 "많이 읽힌 글" 섹션만 사라지고 페이지는 그대로다. 새 DB 표시 컴포넌트도 이 패턴을 따른다.
- 운영 데이터 메모: 이전 구현은 첫 방문 행을 `count` 기본값 0 으로 만들었다. 그래서 그때 생긴 행은 실제 방문 수보다 1 적다(보정하지 않았다).

## 스키마 변경 절차

1. `prisma/schema.prisma` 를 수정한다. 기존 컬럼의 삭제나 이름 변경은 데이터 손실이므로 사용자와 먼저 합의한다(`db push` 는 마이그레이션 이력이 없다).
2. `npx prisma validate` 와 `npx prisma generate` 를 실행한다(둘 다 DB 접속 없음).
3. 실행될 SQL 이 궁금하면 스키마 파일끼리 비교한다(DB 접속 없음, 운영 DB 와의 비교는 불가):
   ```bash
   git fetch origin main   # origin/main 이 오래됐으면 SQL 이 실제와 달라진다
   git show origin/main:prisma/schema.prisma > <scratchpad>/old.prisma
   node scripts/with-blocked-db.mjs npx prisma migrate diff --from-schema <scratchpad>/old.prisma --to-schema prisma/schema.prisma --script
   ```
4. `npm run verify` 를 실행한다.
5. **push 나 PR 생성 전에 직접 사용자에게 묻는다.** Vercel 은 Preview 와 Production 빌드 모두 `npm run vercel-build`(`prisma generate && prisma db push && next build`)를 실행한다. Preview 환경변수는 운영 DB 와 **같다고 가정한다**(분리 여부 미확인): 브랜치를 push 하거나 PR 을 만들거나 `vercel deploy` 하는 순간 리뷰나 머지 전에 운영 스키마가 바뀐다. guard 훅도 `git push`, `gh pr create`, `vercel`/`vercel deploy` 에 확인을 요청하지만(작업 트리 변경 포함) 권한 모드에 따라 안 뜰 수 있으니 기대지 않는다. 사용자에게 Preview 용 DB 분리(Neon branch)를 제안할 수 있다.

3번의 wrapper 형태 말고 맨 `npx prisma migrate …` 는 권한 deny 에 걸린다. `db pull` 은 읽기지만 운영 DB 에 접속하고 schema.prisma 를 덮어써서 금지다. Vercel 대시보드에서 Build Command 를 Override 하면 `vercel-build` 가 무시되어 스키마가 반영되지 않는다.

## 런타임 확인

DB 경로를 확인할 때는 `node scripts/with-blocked-db.mjs …`, `npm run smoke`, `/run-app` 만 쓴다. 차단 env 에서는 쿼리가 `P1001 Can't reach database server at 127.0.0.1:1` 로 즉시 실패하는 것이 정상이다.
