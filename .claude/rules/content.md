---
paths:
  - "contents/**"
---

# 콘텐츠(글) 규칙

검사기 `scripts/validate-content.mjs`(규칙은 `scripts/content/*.mjs`)가 기준이다(편집 시 PostToolUse 훅이 자동 실행). 수동 실행: `npm run content:check [파일...]`. error 는 반드시 고치고, warn 은 의도한 것이 아니면 고친다. 새 글은 `/new-post` 스킬을 쓴다.

## 경로와 slug

- `contents/<tech|log>/<YYYY-MM-DD>/<slug>.mdx`. 날짜 폴더 하나에 `.mdx` 는 정확히 1개다. 같은 날 두 번째 글은 다른 날짜 폴더에 둔다. 카테고리 폴더 바로 아래에는 날짜 폴더만 둔다. 점 파일(`.DS_Store` 등)은 로더(`src/lib/posts.ts`)와 검사기가 건너뛰지만, 점으로 시작하지 않는 파일이나 날짜가 아닌 폴더가 있으면 `posts.ts` 가 그 경로를 담아 throw 해 빌드(와 모든 글 페이지)가 실패한다(검사기 error).
- slug = 파일명 = URL(`/tech/<slug>`) = 조회수 DB 키. 영문 소문자, 숫자, `.`, `-` 만 쓴다(예: `why-using-next.js-14`). 카테고리와 무관하게 유일해야 한다(검사기가 error 로 막고, 로더도 같은 종류 안에서 겹치면 throw 한다).
- 이미 공개된 글의 파일명(slug)이나 폴더를 바꾸거나 글을 지우지 않는다. 조회수와 댓글(utterances, pathname 기준)이 끊긴다(CLAUDE.md 알려진 이슈). 꼭 필요하면 사용자에게 먼저 확인한다.
- 목록 순서는 `publishedAt` 이 아니라 날짜 폴더 이름순이다(`posts.ts` 가 정렬). 새 글은 폴더 날짜와 `publishedAt` 을 같게 둔다. 다르면 검사기는 error 가 아니라 warn 을 낸다. 기존 글 하나(`2023-12-11/javascript-memory-management`, publishedAt 12-12)가 이미 다르고, 공개된 글의 폴더는 옮기지 않기 때문이다.

## frontmatter (5개 필드 필수 + `updatedAt` 선택)

```yaml
---
publishedAt: "2024-05-15"        # 반드시 따옴표. 따옴표가 없으면 Date 로 파싱돼 로더(parseMetadata)가 throw 해 빌드가 실패한다
title: "React Server Components(RSC) 차근차근 이해하기"
tags: ["react.js", "rsc"]        # 비어 있지 않은 문자열 배열. 소문자, 라이브러리는 점 표기(next.js, three.js)
description: "리액트 서버 컴포넌트를 차근차근 이해해보자"   # 다른 글과 겹치지 않게
reference: ["https://react.dev/blog/2024/04/25/react-19"]  # http(s) URL 배열. 없으면 []
updatedAt: "2026-10-24"          # 선택. 반드시 따옴표. 내용이 실질적으로 바뀐 경우에만
---
```

- 기존 태그: `javascript`, `next.js`, `webgl`, `journal`, `three.js`, `r3f`, `react.js`, `rsc`, `tracking`, `habit`. 태그는 카테고리 구분 없이 공용이며 새 태그를 만들기 전에 기존 태그를 우선 쓴다. tech 태그는 /tech 태그 필터(`/tech?tag=<태그>`)와 글 머리 메타 줄의 `#태그` 링크에 쓰인다. log 태그는 `/log` 항목 아래 `#태그` 로만 보이니 고민하지 말고 맞는 것을 고른다(회고·일기형이면 `journal`).
- `reference` 는 본문 끝 "참고 자료" 목록(호스트와 경로)으로 자동 렌더된다. 본문에 따로 쓰지 않는다.
- description 은 메타 description, OG/트위터 메타, RSS 항목 요약(description)에 쓰인다. RSS 항목 본문(content)은 렌더한 글 전체다. OG 이미지에는 title 만 들어간다.
- frontmatter 는 YAML 만 쓴다. `---js` 같은 JS frontmatter 는 검사기 error 이고 로더도 throw 한다(gray-matter 가 eval 하므로 막았다).
- description 은 OG/트위터 메타와 RSS 에 쓰인다.
- `updatedAt`(선택)은 본문 내용이 실질적으로 바뀌었을 때만(내용 보강·정정, 섹션 추가) 그날 날짜로 넣거나 고친다. 오탈자나 서식만 고친 경우에는 넣지 않는다. 글 머리 메타 줄의 "수정 YYYY.MM.DD", JSON-LD `dateModified`, og `article:modified_time`, sitemap 의 글 `lastmod`(그리고 `/tech` 의 lastmod, `/` 는 tech 와 log 중 최신 날짜)에 쓰이고, 없으면 `publishedAt` 이 수정일을 대신한다. 검사기가 형식("YYYY-MM-DD" 따옴표 문자열), `publishedAt` 이상, 오늘(한국 시간) 이하를 error 로 본다. 목록 순서와 폴더는 바꾸지 않는다.

## tech 본문 (unified: remark-parse + remark-gfm → rehype. JSX/MDX 컴포넌트와 raw HTML 은 렌더되지 않고 글자 그대로 보인다)

렌더러는 `src/lib/markdown/`(세부는 `.claude/rules/frontend.md`)다.

- 제목은 `###`(h2, 목차에 나오는 섹션)와 `####`(h3, 목차의 하위 항목)를 쓴다. 렌더러가 한 단계씩 내리므로 `#`/`##` 는 `###` 와 같은 h2 가 되고(검사기 warn), `#####`(h4)·`######`(h5)는 목차에 나오지 않는다(검사기 warn). 목차와 앵커 id 는 같은 트리에서 나오므로 제목에 굵게, 코드, 링크 서식을 넣어도 되고 같은 제목이 반복돼도 된다(id 에 `-1` 이 붙는다). 다만 제목 id 가 페이지의 고정 id(`main`, `post-head`, `post-body`, `footnote-label`, `ref-label`, `rel-label`, `cm-label`)와 같아지는 제목(예: `### Main`, `### Post Body`)은 링크가 다른 요소로 가므로 검사기가 warn 한다. 문구를 바꾼다.
- 코드 블록에는 언어를 붙인다. 하이라이트되는 언어와 별칭은 `src/lib/markdown/languages.ts` 의 `CODE_LANGUAGES`·`LANGUAGE_ALIASES` 다(bash, css, dart, diff, glsl, html, javascript, json, jsx, rust, tsx, typescript, yaml / js, ts, sh, shell, zsh, yml). `text`/`plaintext`/`txt` 는 색 없는 코드, `mermaid` 는 다이어그램이다. 그 밖의 언어나 언어가 없는 펜스는 색 없이 text 로 나오고 검사기가 warn 한다. 대소문자는 구분하지 않는다.
- 코드 블록 info string 문법(언어 뒤에 공백으로 이어 쓴다):
  - ```` ```tsx title="app/page.tsx" ```` : 헤더에 파일명. 따옴표가 없으면 검사기가 warn. 없으면 헤더에 언어 이름(bash 는 "터미널")이 나온다.
  - ```` ```ts {4-6} ```` 또는 `{1,3-5}`: 그 줄을 형광펜으로 강조.
  - `showLineNumbers`: 줄 번호(12줄 이상이면 자동).
  - 줄 끝 주석 `// [!code ++]`, `// [!code --]`: 추가/삭제 줄(배경과 +/− 기호, 주석은 지워짐, 삭제 줄은 복사에서 빠짐). `// [!code highlight]`: 그 줄 강조. 주석 기호는 언어에 맞춘다(`#`, `<!-- -->` 등).
  - 30줄을 넘으면 접혀서 "N줄 모두 보기" 버튼이 생긴다. bash 블록은 명령 줄 앞에 `$` 가 자동으로 붙으니 원문에 `$` 를 쓰지 않는다(`#` 주석 줄, `\` 로 이어지는 줄, `├──` 같은 디렉터리 트리 블록에는 붙지 않는다). 줄 번호가 붙는 블록(12줄 이상이거나 `showLineNumbers`)과 diff 표기가 있는 블록은 블록 전체에 `$` 가 붙지 않는다.
- 인용 `>` 는 진짜 인용에만 쓴다(왼쪽 선과 흐린 글자로 보인다). 보충 설명, 팁, 주의는 콜아웃을 쓴다. 타입은 5종이며 그 밖의 `[!X]` 는 일반 인용으로 렌더되고 검사기가 warn 한다:

  ```md
  > [!NOTE]
  > 보충 설명 (참고)

  > [!TIP]
  > **제목 한 줄**
  > 첫 줄이 굵게뿐이면 콜아웃 제목으로 올라간다. 본문은 다음 줄부터.
  ```

  `[!TIP]`(팁), `[!IMPORTANT]`(중요), `[!WARNING]`(주의), `[!CAUTION]`(경고)도 같은 형식이다. 마커 뒤 같은 줄에 평문을 쓰면(`> [!NOTE] 제목`) 콜아웃이 아니라 `[!NOTE] 제목` 이 글자 그대로 보이는 일반 인용이 된다(검사기 warn). 제목은 다음 줄에 `**제목**` 으로 쓴다.
- 각주: 본문에 `[^1]`, 아무 곳에 `[^1]: 내용`. 각주 내용은 글 끝 "각주" 섹션에만 나오고(사이드노트 없음), 본문의 참조는 `[n]` 링크로 보인다. 정의 없는 참조, 참조 없는 정의는 검사기가 warn 한다(인라인 코드 안의 `[^x]` 는 제외). 라벨은 대소문자를 구분하지 않는다(`[^A]` 와 `[^a]:` 는 같은 각주).
- mermaid: ```` ```mermaid ```` 펜스는 다이어그램으로 그려진다(`title="…"` 은 캡션). 모바일에서는 `flowchart LR`/`RL` 이 세로(`TD`)로 다시 그려진다. 그리지 못하면 원문 소스가 그대로 보인다.
- 목록은 `-` 를 쓴다. 외부 링크는 새 탭으로 열린다(↗ 표시). `https://www.blan19.xyz/...` 링크는 사이트 안 이동이다. 표는 넓으면 가로 스크롤된다.

### 이미지

```md
![설명 {priority} {caption: 캡션} {768x432}](https://github.com/blan19/blan19.xyz/assets/66871265/<id>)
```

- 이미지는 단독 문단으로 둔다(앞뒤 빈 줄). 이미지로 시작하는 문단의 나머지 텍스트는 사라진다. 참조 형식(`![설명][ref]`)은 검사기가 확인하지 못하니 `![설명](URL)` 형식만 쓴다.
- alt 메타: `{priority}`(첫 화면 이미지. 글의 첫 번째 이미지에 붙었을 때만 적용되고 다른 이미지의 `{priority}` 는 무시된다), `{caption: 텍스트}`(콜론 뒤 공백 하나, 텍스트에 `{` `}` 불가), `{<숫자>x<숫자>}`(가로x세로, 공백 없이 소문자 `x`, 0 불가. 예: `{768x432}`. 없으면 768x432). alt 설명 텍스트는 필수다.
- 렌더러는 alt 에서 `{…}` 토큰을 모두 지운 나머지를 alt 로 쓰고, 크기는 첫 `{<숫자>x<숫자>}` 토큰만 읽는다. 형식이 다른 토큰(`{768X432}`, `{768 x 432}`)은 무시되고 크기는 기본값이 된다(검사기가 warn).
- 원격 이미지는 `next.config.js` 의 `images.remotePatterns` 에 맞는 URL 만 허용된다: `https://github.com/blan19/**`(이 계정 저장소의 이슈/PR 첨부, `.../<repo>/assets/...`)와 `https://github.com/user-attachments/**`, 둘 다 쿼리 문자열 없이. 다른 사람 저장소의 첨부와 `user-images.githubusercontent.com` 직접 URL 은 허용되지 않는다(검사기 error). 이미지 최적화기는 GitHub 의 리다이렉트(`*.githubusercontent.com`)를 따라가지만, 대상이 인증이 필요한 첨부(비공개 저장소)거나 지워졌으면 실패하니 미리보기로 이미지가 뜨는지 확인한다.
- 로컬 이미지는 `public/` 기준 절대경로(`/image/<slug>/<파일>`)다. 파일은 `public/image/<slug>/` 에 두고 이름은 `01-설명.png` 처럼 순번을 붙인다.
- 그 외 호스트가 필요하면 `next.config.js` 변경이 먼저다(사용자 확인 후).

## log 본문

`/log` 는 마크다운을 렌더하지 않고 원문을 빈 줄 기준 문단으로 나눠 줄바꿈만 살려 그대로 출력한다. 홈 "최근 기록" 줄에는 최신 log 의 날짜, 제목, 첫 문단 발췌가 보인다. 제목, 코드, 이미지, 목록, 강조, 링크, 인용 문법을 쓰지 않고 평문 문단만 쓴다(검사기가 warn). 상세 페이지가 없다. 본문이 곧 사용자의 경험과 소감이므로 사용자가 주지 않은 감상을 지어내지 않는다.

## 문체 (기존 글 기준)

- tech: 존댓말 "-습니다/-입니다". 1인칭은 "저/제". 도입(배경, 동기) → `###` 섹션별 설명과 코드 예시 → `### 마치면서`, `### 마무리`, `### 마무리하며` 중 하나로 소감을 정리한다. 기술 용어는 원어를 그대로 쓴다(Server actions, RSC Payload).
- log: 반말 "-다" 체의 일기형 평문.
- 사실, 수치, 인용, 링크를 지어내지 않는다. 모르는 내용은 사용자에게 묻거나 `TODO:` 로 표시하고, 커밋 전에 모두 해소한다. 검사기가 코드 블록 밖의 `TODO:` 를 편집 중 검사(훅, `content:check`)에서는 warn, `verify`(`--strict`)와 CI 에서는 error 로 보고한다. 코드 예시의 `// TODO:` 주석은 검사하지 않는다.
