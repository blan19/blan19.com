import type { Metadata } from "next";
import { Suspense } from "react";
import { getPostsNewestFirst, getTagCounts } from "@/lib/posts";
import type { Post } from "@/lib/posts";
import { alternates, openGraph } from "@/lib/metadata";
import PostList from "@/components/ui/post-list";
import TagFilter from "@/components/ui/tag-filter";

const TITLE = "글 목록";
const DESCRIPTION = "일하며 부딪힌 문제와 알게 된 것을 정리한 글을 모았습니다.";

// 태그로 거른 /tech?tag=… 도 canonical 은 /tech 하나다.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: alternates("/tech"),
  openGraph: openGraph("/tech", TITLE, DESCRIPTION),
};

type SearchParams = Promise<{ tag?: string | string[] }>;

// 문자열 하나만 인정(배열이면 첫 값). 없는 태그면 전체 목록으로 돌아간다.
const selectedTag = async (
  searchParams: SearchParams,
  tags: [string, number][],
) => {
  const { tag } = await searchParams;
  const requested = Array.isArray(tag) ? tag[0] : tag;
  return tags.some(([name]) => name === requested) ? requested : undefined;
};

interface FilterProps {
  searchParams: SearchParams;
  posts: readonly Post[];
  tags: [string, number][];
}

// searchParams 는 요청 때만 알 수 있어 이 둘만 <Suspense> 안에서 그린다(Cache Components).
// 빌드 때 만드는 정적 셸에는 fallback 인 전체 목록(조회수 없음)이 들어간다.
const Filter = async ({ searchParams, posts, tags }: FilterProps) => (
  <TagFilter
    tags={tags}
    total={posts.length}
    selected={await selectedTag(searchParams, tags)}
  />
);

const FilteredList = async ({ searchParams, posts, tags }: FilterProps) => {
  const selected = await selectedTag(searchParams, tags);
  const visible = selected
    ? posts.filter((post) => post.metadata.tags.includes(selected))
    : posts;
  return <PostList posts={visible} variant="archive" />;
};

const Tech = ({ searchParams }: { searchParams: SearchParams }) => {
  const posts = getPostsNewestFirst("tech");
  const tags = getTagCounts(posts);
  const filter = { searchParams, posts, tags };

  return (
    <div className="site-wrap">
      <header className="rail-grid page-head">
        <div className="rail-main">
          <h1 className="page-h1">글</h1>
          <p className="page-lede">일하며 부딪힌 문제와 알게 된 것을 정리합니다.</p>
          {posts.length > 0 && (
            <Suspense fallback={<TagFilter tags={tags} total={posts.length} />}>
              <Filter {...filter} />
            </Suspense>
          )}
        </div>
      </header>
      {posts.length > 0 ? (
        <div className="tech-list">
          <Suspense
            fallback={<PostList posts={posts} variant="archive" views={false} />}
          >
            <FilteredList {...filter} />
          </Suspense>
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
