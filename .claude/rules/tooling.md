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
| `src/components/ui/mdx/index.tsx` | `scripts/validate-content.mjs`(`registerLanguage` 목록을 읽음) | 기본 언어 5개로 조용히 대체 |
| `next.config.js` | `validate-content.mjs`(`require` 로 `images.remotePatterns`), ci.yml 캐시 키 | 허용 호스트가 `[]` 가 되어 원격 이미지가 모두 error |
| `contents/` | `post-edit-check.mjs`(`.mdx` 검사 대상 접두어), `validate-content.mjs`, `smoke.mjs`(`contents/tech` 에서 slug 선택), `guard-bash.test.mjs`(픽스처), ci.yml 캐시 키 | content:check 와 smoke 실패. 훅의 글 검사는 조용히 빠짐 |
| `scripts/validate-content.mjs` | `post-edit-check.mjs`, `verify.mjs`, `package.json`, settings.json allow | 훅 실패 |
| `scripts/with-blocked-db.mjs` | `guard-bash.mjs`(basename `with-blocked-db.mjs` 로 DB 차단 실행을 허용), `verify.mjs`·`smoke.mjs`(import), `package.json`(`dev:safe`), ci.yml, settings.json allow, skills | 차단 실행이 거부되거나 권한 확인이 늘어남 |
| `prisma/schema.prisma` | `guard-bash.mjs`(push/PR 확인 조건) | 스키마 변경 push 확인이 사라짐 |
| `src/generated/prisma` | `session-start.mjs`, `post-edit-check.mjs`(SKIP_DIRS), eslint ignore, `.gitignore`, schema.prisma output | 상태 표시와 lint 대상이 틀어짐 |
| `src/app/og/noto-sans-v27-latin-regular.ttf` | `src/app/og/route.tsx`(`process.cwd()` 기준) | smoke 의 `/og` 실패. 경로를 고쳐도 새 위치가 Vercel 파일 트레이싱에 안 잡히면 운영에서만 실패 |
| `public/font/Pretendard-*.woff2` | `src/app/layout.tsx`(`localFont` 의 상대경로) | 빌드 실패 |

- 차단 DB 주소 `postgres://blocked:blocked@127.0.0.1:1/blocked` 는 `with-blocked-db.mjs`, ci.yml, `guard-bash.test.mjs` 에 따로 적혀 있고, `smoke.mjs` 의 로그 분류 정규식(`127\.0\.0\.1:1`)이 이 주소를 전제한다. 문서(CLAUDE.md, database.md, verify 스킬)에도 있다. 바꾸면 모두 바꾼다.
- `verify.mjs` 단계를 바꾸면 ci.yml 도 같이 바꾼다(CLAUDE.md). 훅을 고치면 `npm run test:hooks` 를 실행한다.
- settings.json 의 allow 규칙은 스크립트 경로를 문자열로 갖는다. 스크립트를 옮기면 allow 도 고친다.
