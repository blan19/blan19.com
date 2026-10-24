import type { Metadata } from "next";
import { getPostsNewestFirst, getTagCounts } from "@/lib/posts";
import { alternates, openGraph } from "@/lib/seo";
import PostList from "@/components/ui/post-list";
import TagFilter from "@/components/ui/tag-filter";

const TITLE = "글 목록";
// 메타 전용(화면의 page-lede 와 따로 둔다). 실제 글 주제만 적는다.
const DESCRIPTION =
  "React 19와 RSC, Next.js 14, JavaScript 메모리 관리, WebGL, Three.js와 R3F, 팀 문화를 다룬 글 목록입니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: alternates("/tech"),
  openGraph: openGraph({ title: TITLE, description: DESCRIPTION, path: "/tech" }),
};

const Tech = async ({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>;
}) => {
  const { tag: tagParam } = await searchParams;
  const posts = getPostsNewestFirst("tech");
  const tags = getTagCounts(posts);

  // 문자열 하나만 인정(배열이면 첫 값). 없는 태그면 전체 목록으로 돌아간다.
  const requested = Array.isArray(tagParam) ? tagParam[0] : tagParam;
  const selected = tags.some(([tag]) => tag === requested)
    ? requested
    : undefined;
  const visible = selected
    ? posts.filter((post) => post.metadata.tags.includes(selected))
    : posts;

  return (
    <div className="site-wrap">
      <header className="rail-grid page-head">
        <div className="rail-main">
          <h1 className="page-h1">글</h1>
          <p className="page-lede">일하며 부딪힌 문제와 알게 된 것을 정리합니다.</p>
          {posts.length > 0 && (
            <TagFilter tags={tags} total={posts.length} selected={selected} />
          )}
        </div>
      </header>
      {posts.length > 0 ? (
        <div className="tech-list">
          <PostList posts={visible} variant="archive" />
        </div>
      ) : (
        <div className="rail-grid">
          <p className="rail-main empty-note">아직 글이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default Tech;
