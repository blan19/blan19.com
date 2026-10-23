import clsx from "clsx";
import { groupByYear } from "@/lib/posts";
import type { Post } from "@/lib/posts";
import PostRow from "@/components/ui/post-row";

interface PostListProps {
  posts: Post[];
  variant: "compact" | "full";
  newestSlug?: string;
  // 헤딩 단계를 건너뛰지 않게: 홈(h1 → h2 "최근 글" → 연도)은 h3, /tech(h1 → 연도)는 h2
  yearHeading: "h2" | "h3";
}

const PostList = ({ posts, variant, newestSlug, yearHeading }: PostListProps) => {
  const YearHeading = yearHeading;

  return (
    <>
      {groupByYear(posts).map(({ year, posts: group }) => (
        <div key={year} className="year-group">
          <YearHeading className="year-label">
            {year} <span className="cnt">{group.length}편</span>
          </YearHeading>
          <ol className={clsx("post-rows", variant === "full" && "is-full")}>
            {group.map((post) => (
              <PostRow
                key={post.slug}
                post={post}
                variant={variant}
                isNewest={post.slug === newestSlug}
              />
            ))}
          </ol>
        </div>
      ))}
    </>
  );
};

export default PostList;
