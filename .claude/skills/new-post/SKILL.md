---
name: new-post
description: blan19.com 블로그에 새 글(tech 또는 log)을 만든다. 날짜 폴더와 slug 를 정하고, 템플릿으로 frontmatter 를 채우고, 기존 문체로 초안을 쓴 뒤 content:check 로 검사한다.
when_to_use: 사용자가 "새 글 써줘", "포스트 작성", "블로그 글 초안", "글 추가", "log 남겨줘", "write a new post", "draft a blog post", "add an article" 같은 요청. 이미 있는 글을 고칠 때는 쓰지 않는다(그때는 .claude/rules/content.md 를 따른다).
argument-hint: "[tech|log] [제목 또는 주제] [slug(선택)]"
---

# /new-post

입력: `$ARGUMENTS` (형식: `<tech|log> <제목/주제> [slug]`). 규칙의 기준은 `.claude/rules/content.md` 와 `scripts/validate-content.mjs` 다. 먼저 `content.md` 를 읽는다.

## 1. 필수 정보 확인

- 카테고리(`tech` | `log`)와 주제가 없으면 사용자에게 묻는다.
- tech 글은 핵심 내용(다룰 포인트, 직접 겪은 사례, 참고 링크)이 없으면 지어내지 말고 한 번에 모아서 묻는다. 사용자가 "알아서"라고 하면 개요와 섹션 골격만 쓰고, 확인이 필요한 사실은 본문 문장에 `TODO:` 로 남긴다(코드 블록 안의 `TODO:` 는 검사되지 않으니 초안 표시로 쓰지 않는다).
- log 글은 본문이 사용자의 경험과 소감이다. 주어지지 않은 감상은 지어내지 않는다. 한 번에 모아 묻거나, 받은 사실만 문장으로 쓰고 나머지는 `TODO:` 로 남긴다.

## 2. 날짜와 slug

```bash
TZ=Asia/Seoul date +%F                  # 오늘 날짜 = 폴더 이름 = publishedAt
ls contents/<cat>/<date> 2>/dev/null     # 이미 있으면 같은 폴더에 둘 수 없음 → 사용자에게 다른 날짜를 제안
find contents -name '<slug>.mdx'         # 결과가 있으면 slug 중복 → 다른 slug
```

- slug 는 영문 소문자 kebab-case 이며 `[a-z0-9.-]` 만 쓴다. 라이브러리 이름의 점은 유지한다(`why-using-next.js-14`). 사용자가 주면 그대로 쓰고 형식만 확인한다.
- slug 는 URL 이자 조회수 키라서 공개 후 바꿀 수 없다. 제목의 핵심 키워드로 짧게 짓는다.

## 3. 파일 생성

- tech 는 [template-tech.mdx](template-tech.mdx), log 는 [template-log.mdx](template-log.mdx) 를 기반으로 `contents/<cat>/<date>/<slug>.mdx` 를 Write 한다.
- frontmatter:
  - `publishedAt`: 폴더와 같은 날짜를 따옴표로 감싼다.
  - `title`: 한국어. 기술 이름은 원어를 쓴다.
  - `tags`: 기존 태그를 우선 쓴다. 기존 태그 목록과 log 태그 기준은 `content.md` 에 있다.
  - `description`: 한 문장. 다른 글과 겹치지 않게 쓴다.
  - `reference`: 실제로 참고한 URL 만 넣는다. 없으면 `[]`.
- 저장하면 PostToolUse 훅이 검사기를 자동 실행한다. 보고된 error 는 바로 고친다.

## 4. 본문 초안 (기존 글 문체)

- tech:
  - "-습니다/-입니다" 체로 쓴다.
  - 도입(배경, 동기) → `###` 섹션과 `####` 하위 섹션 → 코드 예시 → `### 마치면서`(또는 `### 마무리`, `### 마무리하며`) 순서로 구성한다.
  - 코드 블록에는 언어를 붙인다. 지원 언어는 `src/lib/markdown/languages.ts` 의 `CODE_LANGUAGES`(별칭 `LANGUAGE_ALIASES`)다. 파일 코드는 ```` ```tsx title="app/page.tsx" ```` 처럼 `title="파일명"` 을 붙인다. 줄 강조 `{4-6}`, 변경 표시 `// [!code ++]`/`// [!code --]` 문법은 content.md 를 따른다.
  - 보충 설명, 팁, 주의는 콜아웃(`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` 등)으로 쓴다. 일반 `>` 인용은 실제 인용문에만 쓴다.
  - 이미지는 사용자가 준 URL 만 쓴다. 단독 문단, `{priority}`/`{caption: …}`/`{768x432}` 메타 형식을 지킨다(content.md).
- log: "-다" 체 평문 문단만 쓴다. 마크다운 문법(목록, 굵게, 링크 포함)은 쓰지 않는다.
- 사실, 수치, 인용, 링크를 지어내지 않는다.

## 5. 검사

```bash
npm run content:check contents/<cat>/<date>/<slug>.mdx   # error 0개가 될 때까지 고친다
```

warn 은 의도한 것인지 확인하고 보고에 남긴다. 남은 `TODO:`(코드 블록 밖)는 검사기가 행 번호와 함께 warn 으로 보고한다(CI 에서는 error). 커밋 전에 해소해야 한다고 알린다.

## 6. 미리보기 (선택, 사용자가 원할 때)

`/run-app` 스킬의 `preview` 절차를 따른다(log 는 `/log` 에서 확인). `npm run dev` 로 띄운 서버에서 `/tech/<slug>` 를 열면 운영 조회수가 오른다. 확인이 끝나면 서버를 종료한다.

## 7. 마무리 보고

- 만든 파일 경로, slug, URL(`https://www.blan19.xyz/tech/<slug>`, log 는 `/log`)
- content:check 결과(error/warn 개수), 남은 `TODO:`
- 제안 커밋 메시지: `contents: <slug>` (커밋은 사용자가 요청할 때만 한다)
- 참고: 새 tech 글은 배포되면 홈 "최근 글"과 /tech 에 바로 나온다(파일시스템 기준). 홈 "많이 읽힌 글"은 조회수 상위 3개라 별개다.
