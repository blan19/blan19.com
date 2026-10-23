import { groupByYear } from "@/lib/posts";
import type { Post } from "@/lib/posts";
import PostRow from "@/components/ui/post-row";

interface PostListProps {
  posts: readonly Post[];
  // home: 연도 묶음 없는 한 목록(설명은 데스크톱만, 조회수 없음)
  // archive(/tech): 연도별 섹션, 연도 라벨은 레일(≥1280)에. 헤딩 순서 h1 → h2(연도)
  variant: "home" | "archive";
}

const PostList = ({ posts, variant }: PostListProps) => {
  if (variant === "home") {
    return (
      <ol className="idx-list">
        {posts.map((post) => (
          <PostRow
            key={post.slug}
            post={post}
            date="full"
            desc="desktop"
            views={false}
          />
        ))}
      </ol>
    );
  }

  return (
    <>
      {groupByYear(posts).map(({ year, posts: group }) => (
        <section
          key={year}
          className="rail-grid list-year"
          aria-labelledby={`y-${year}`}
        >
          <h2 className="rail-side rail-label" id={`y-${year}`}>
            {year}
          </h2>
          <div className="rail-main">
            <ol className="idx-list">
              {group.map((post) => (
                <PostRow
                  key={post.slug}
                  post={post}
                  date="month-day"
                  desc="always"
                  views
                />
              ))}
            </ol>
          </div>
        </section>
      ))}
    </>
  );
};

export default PostList;
