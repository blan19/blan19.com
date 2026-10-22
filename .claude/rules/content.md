---
paths:
  - "contents/**"
---

# 콘텐츠(글) 규칙

검사기 `scripts/validate-content.mjs` 가 기준이다(편집 시 PostToolUse 훅이 자동 실행). 수동 실행: `npm run content:check [파일...]`. error 는 반드시 고치고, warn 은 의도한 것이 아니면 고친다. 새 글은 `/new-post` 스킬을 쓴다.

## 경로와 slug

- `contents/<tech|log>/<YYYY-MM-DD>/<slug>.mdx`. 날짜 폴더 하나에 `.mdx` 는 정확히 1개다. 같은 날 두 번째 글은 다른 날짜 폴더에 둔다. 카테고리 폴더 바로 아래에는 날짜 폴더만 둔다(`.DS_Store` 같은 파일도 안 된다). 어기면 `src/lib/posts.ts` 가 실패해 모든 페이지가 깨진다.
- slug = 파일명 = URL(`/tech/<slug>`) = 조회수 DB 키. 영문 소문자, 숫자, `.`, `-` 만 쓴다(예: `why-using-next.js-14`). 카테고리와 무관하게 유일해야 한다(검사기가 error 로 막는다).
- 이미 공개된 글의 파일명(slug)이나 폴더를 바꾸거나 글을 지우지 않는다. 조회수와 댓글(utterances, pathname 기준)이 끊긴다(CLAUDE.md 알려진 이슈). 꼭 필요하면 사용자에게 먼저 확인한다.
- 목록 순서는 `publishedAt` 이 아니라 날짜 폴더 순서를 따른다. 새 글은 폴더 날짜와 `publishedAt` 을 같게 둔다. 다르면 검사기는 error 가 아니라 warn 을 낸다. 기존 글 하나(`2023-12-11/javascript-memory-management`, publishedAt 12-12)가 이미 다르고, 공개된 글의 폴더는 옮기지 않기 때문이다.

## frontmatter (5개 필드 모두 필수)

```yaml
---
publishedAt: "2024-05-15"        # 반드시 따옴표. 따옴표가 없으면 Date 로 파싱돼 화면이 크래시한다
title: "React Server Components(RSC) 차근차근 이해하기"
tags: ["react.js", "rsc"]        # 비어 있지 않은 문자열 배열. 소문자, 라이브러리는 점 표기(next.js, three.js)
description: "리액트 서버 컴포넌트를 차근차근 이해해보자"   # 다른 글과 겹치지 않게
reference: ["https://react.dev/blog/2024/04/25/react-19"]  # http(s) URL 배열. 없으면 []
---
```

- 기존 태그: `javascript`, `next.js`, `webgl`, `journal`, `three.js`, `r3f`, `react.js`, `rsc`, `tracking`, `habit`. 태그는 카테고리 구분 없이 공용이며 새 태그를 만들기 전에 기존 태그를 우선 쓴다. log 태그는 화면과 RSS 어디에도 표시되지 않으니 고민하지 말고 맞는 것을 고른다(회고·일기형이면 `journal`).
- `reference` 는 본문 끝 "글 작성에 도움을 준 레퍼런스들" 목록으로 자동 렌더된다. 본문에 따로 쓰지 않는다.
- description 은 OG/트위터 메타와 RSS 에 쓰인다.

## tech 본문 (react-markdown + remark-gfm. JSX/MDX 컴포넌트와 raw HTML 은 렌더되지 않는다)

- 제목은 `###`(목차에 나오는 섹션)와 `####`(하위)만 쓴다. `#`/`##` 는 스타일이 없다. `###` 제목에는 `#`, 굵게, 코드, 링크 서식을 넣지 않고 중복시키지 않는다(목차 앵커가 어긋난다).
- 코드 블록에는 언어를 붙인다. 하이라이트되는 언어는 `src/components/ui/mdx/index.tsx` 의 `registerLanguage` 목록이다. 그 밖의 언어는 색 없이 나오고 검사기가 warn 한다. TOC(`ui/toc`)는 원문 줄 어디에서든 `###` 부터 줄 끝까지를 정규식으로 뽑으므로(`#` 가 정확히 3개일 때) 문단, 인라인 코드, 코드 블록에 `###` 를 쓰지 않는다. 검사기는 코드 블록 안만 warn 한다.
- 인용 `>` 는 보충 설명이나 인용에, 목록은 `-` 를 쓴다. 외부 링크는 새 탭으로 열린다.

### 이미지

```md
![설명 {priority} {caption: 캡션} {768x432}](https://github.com/blan19/blan19.xyz/assets/66871265/<id>)
```

- 이미지는 단독 문단으로 둔다(앞뒤 빈 줄). 이미지로 시작하는 문단의 나머지 텍스트는 사라진다. 참조 형식(`![설명][ref]`)은 검사기가 확인하지 못하니 `![설명](URL)` 형식만 쓴다.
- alt 메타: `{priority}`(첫 화면 이미지), `{caption: 텍스트}`(콜론 뒤 공백 하나, 텍스트에 `{` `}` 불가), `{<숫자>x<숫자>}`(가로x세로, 공백 없이 소문자 `x`, 0 불가. 예: `{768x432}`. 없으면 768x432). alt 설명 텍스트는 필수다.
- 렌더러는 alt 에서 `{…}` 토큰을 모두 지운 나머지를 alt 로 쓰고, 크기는 첫 `{<숫자>x<숫자>}` 토큰만 읽는다. 형식이 다른 토큰(`{768X432}`, `{768 x 432}`)은 무시되고 크기는 기본값이 된다(검사기가 warn).
- 원격 이미지는 `next.config.js` 의 `images.remotePatterns` 호스트만 허용된다: `github.com`, `user-images.githubusercontent.com` (https). 기존 글은 GitHub 이슈/PR 에 올린 첨부 URL(`https://github.com/<owner>/<repo>/assets/...`, 이 저장소 외 다른 저장소 것도 있음)을 쓴다. Next 이미지 최적화기는 원래 URL 의 호스트만 remotePatterns 와 비교하고 리다이렉트(최대 3회)는 호스트 검사 없이 따라간다. 그래서 `github.com/user-attachments/...` 도 허용된다. 다만 리다이렉트 대상이 인증이 필요한 첨부(비공개 저장소)면 실패하니 미리보기로 이미지가 뜨는지 확인한다. 로컬 이미지는 `public/` 기준 절대경로(`/image/...`).
- 그 외 호스트가 필요하면 `next.config.js` 변경이 먼저다(사용자 확인 후).

## log 본문

`/log` 는 마크다운을 렌더하지 않고 원문을 줄바꿈만 살려 그대로 출력한다. 제목, 코드, 이미지, 목록, 강조, 링크, 인용 문법을 쓰지 않고 평문 문단만 쓴다(검사기가 warn). 상세 페이지가 없다. 본문이 곧 사용자의 경험과 소감이므로 사용자가 주지 않은 감상을 지어내지 않는다.

## 문체 (기존 글 기준)

- tech: 존댓말 "-습니다/-입니다". 1인칭은 "저/제". 도입(배경, 동기) → `###` 섹션별 설명과 코드 예시 → `### 마치면서`, `### 마무리`, `### 마무리하며` 중 하나로 소감을 정리한다. 기술 용어는 원어를 그대로 쓴다(Server actions, RSC Payload).
- log: 반말 "-다" 체의 일기형 평문.
- 사실, 수치, 인용, 링크를 지어내지 않는다. 모르는 내용은 사용자에게 묻거나 `TODO:` 로 표시하고, 커밋 전에 모두 해소한다. 검사기가 코드 블록 밖의 `TODO:` 를 warn 으로(CI 에서는 error 로) 보고한다. 코드 예시의 `// TODO:` 주석은 검사하지 않는다.
