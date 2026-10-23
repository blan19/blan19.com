// 글 페이지(/tech/<slug>)에 고정으로 있는 DOM id. 제목 id(rehype-slug)와 겹치면 앵커, 목차, 건너뛰기 링크가 엉뚱한 곳으로 간다.
// 콘텐츠 검사기(scripts/content/body.mjs 의 FIXED_PAGE_IDS)가 이 값들과 겹치는 제목을 warn 한다. 새 고정 id 는 여기에 넣는다.
// import 를 두지 않는다(타입 import 도 없음): 클라이언트 컴포넌트와 검사기(Node 타입 제거)가 함께 읽는다.
export const PAGE_IDS = {
  // src/app/layout.tsx 의 <main>(건너뛰기 링크 대상)
  main: "main",
  // ui/post-header, ui/post-body. ui/toc-spy 가 찾는다.
  postHead: "post-head",
  postBody: "post-body",
  // remark-rehype(mdast-util-to-hast)가 각주 제목에 고정으로 다는 id(옵션으로 바꿀 수 없다). 검사용으로만 둔다.
  footnoteLabel: "footnote-label",
  // ui/post-references, ui/comment 의 글 끝 섹션 제목
  refLabel: "ref-label",
  commentLabel: "cm-label",
} as const;
