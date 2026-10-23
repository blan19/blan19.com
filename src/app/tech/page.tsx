import type { Metadata } from "next";
import { getPostsNewestFirst, getTagCounts } from "@/lib/posts";
import PostList from "@/components/ui/post-list";
import TagFilter from "@/components/ui/tag-filter";

export const metadata: Metadata = {
  title: "글 목록",
  description:
    "React, Next.js, WebGL처럼 공부한 기술과 일하면서 고민한 걸 적은 글을 모았어요.",
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
          <p className="page-lede">
            개발하면서 공부하고 고민한 걸 적어요.
          </p>
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
          <p className="rail-main empty-note">아직 글이 없어요.</p>
        </div>
      )}
    </div>
  );
};

export default Tech;
