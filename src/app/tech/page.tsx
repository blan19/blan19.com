import type { Metadata } from "next";
import { getPostsNewestFirst, getTagCounts } from "@/lib/posts";
import { formatYearMonth } from "@/lib/format-date";
import PostList from "@/components/ui/post-list";
import TagFilter from "@/components/ui/tag-filter";

export const metadata: Metadata = {
  title: "Tech Posts",
  description:
    "Read my thoughts on the Frontend ecosystem and everyday my life",
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

  const oldest = posts[posts.length - 1];
  const newest = posts[0];

  return (
    <div className="site-wrap">
      <header className="site-col tech-head">
        <p className="kicker">tech / 전체 목차</p>
        <h1 className="page-title">글</h1>
        <p className="page-lede">
          렌더링, 그래픽스, 그리고 일하는 방식에 대해 차근차근 풀어 쓴
          글입니다.
        </p>
        <p className="count-line">
          <span>{String(posts.length).padStart(2, "0")}편</span>
          {newest && oldest && (
            <span>
              {formatYearMonth(oldest.metadata.publishedAt)} –{" "}
              {formatYearMonth(newest.metadata.publishedAt)}
            </span>
          )}
          <span>읽는 시간은 추정치</span>
        </p>
        <div className="double-rule" />
      </header>
      <section className="site-col tech-list" aria-label="글 목록">
        {posts.length > 0 ? (
          <>
            <TagFilter tags={tags} total={posts.length} selected={selected} />
            <PostList
              posts={visible}
              variant="full"
              newestSlug={newest.slug}
              yearHeading="h2"
            />
          </>
        ) : (
          <p className="empty-note">아직 글이 없어요.</p>
        )}
      </section>
    </div>
  );
};

export default Tech;
