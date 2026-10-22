---
paths:
  - "prisma/**"
  - "prisma.config.ts"
  - "src/lib/prisma.ts"
  - "src/app/db/**"
---

# DB / Prisma 7 규칙

운영 DB 안전 규칙과 금지 명령은 CLAUDE.md 를 따른다. 이 파일은 그 밖의 DB 세부다.

## 구성

- `prisma/schema.prisma`: generator `prisma-client`, output `../src/generated/prisma`(gitignore 대상). datasource 에 url 이 없고 `prisma.config.ts` 가 `dotenv/config` 를 로드해 `process.env.POSTGRES_URL_NON_POOLING` 을 CLI 용으로 넘긴다. Prisma 의 `env("…")` 헬퍼로 바꾸지 않는다(`.env` 나 변수가 없는 환경, 예를 들어 새 클론에서 generate 가 실패한다).
- 런타임 클라이언트 `src/lib/prisma.ts`: `PrismaClient({ adapter: new PrismaPg({ connectionString: POSTGRES_PRISMA_URL, ssl: true }) })`. development 에서만 `global.prisma` 로 캐시한다. URL 에 `sslmode` 가 없으면 TLS 로 접속한다(URL 의 `sslmode` 가 `ssl: true` 보다 우선).
- import 경로는 `@/generated/prisma/client` 다. `@prisma/client` 에서 import 하지 않는다.
- 모델은 `View { id, slug @unique, count, createAt, updatedAt }` 하나다. 필드 이름은 `createAt` 이다(오타지만 운영 컬럼명이므로 바꾸지 않는다).

## 함수와 쓰기 경로

| 함수 | 파일 | 동작 | 캐시 |
|---|---|---|---|
| `increment(slug)` | `src/app/db/action.ts` | **쓰기**: upsert, count+1 | `unstable_noStore` |
| `getViewCount(slug)` | `src/app/db/queries.ts` | findUnique. `POSTGRES_URL` 이 비어 있으면 null | `unstable_noStore` |
| `getBestBlogPosts()` | 같은 파일 | count desc, 3개 | `unstable_cache`, 키 `blan19-best-posts`, 3600초, 태그 없음 |
| `getLatestBlogPosts()` | 같은 파일 | createAt desc, 3개 | `unstable_cache`, 키 `blan19-latest-posts`, 3600초 |

- DB 쓰기는 `/tech/[slug]` 렌더 중 `cache(increment)` 호출 하나뿐이다(await 없음). 실제 DB 로 띄운 서버에 이 경로를 요청하면 운영 조회수가 오른다.
- 두 파일은 `"use server"` 라 모든 export 가 Server Function 이다. 내부용 헬퍼를 여기에 export 하지 않는다.
- 캐시 키를 바꾸면 기존 캐시와 분리된다. 태그 기반 무효화(`revalidateTag`)는 현재 없다.
- 알려진 이슈(요청 없이 고치지 말 것): 홈 "최근 블로그 포스팅"은 `View.createAt` 순, 즉 처음 조회된 순이라 새 글은 한 번 조회되기 전까지 나오지 않는다. `POSTGRES_URL` 검사는 `getViewCount` 에만 있고(연결에는 `POSTGRES_PRISMA_URL` 사용), `getBest/LatestBlogPosts` 는 검사 없이 쿼리한다. `increment` 는 await 없이 호출된다.

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
