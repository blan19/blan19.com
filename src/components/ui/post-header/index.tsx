import Link from "next/link";
import { Suspense } from "react";
import type { Post } from "@/lib/posts";
import { formatDotDate } from "@/lib/format";
import ArticleViews, { ViewsPending } from "@/components/ui/view-count";

interface PostHeaderProps {
  post: Post;
}

// id="post-head" 는 TocSpy(모바일 pill 표시 시점)가 찾는다.
// 메타 줄: 날짜 · 수정일(updatedAt 이 있을 때만) · 읽는 시간 · 조회수 · #태그(글의 태그는 여기에만 있다).
const PostHeader = ({ post }: PostHeaderProps) => {
  const { slug, readingMinutes, metadata } = post;
  const { title, description, publishedAt, updatedAt, tags } = metadata;

  return (
    <header className="rail-main post-head" id="post-head">
      <p className="post-meta">
        <time dateTime={publishedAt}>{formatDotDate(publishedAt)}</time>
        {updatedAt && (
          <span>
            수정 <time dateTime={updatedAt}>{formatDotDate(updatedAt)}</time>
          </span>
        )}
        <span>{readingMinutes}분</span>
        <Suspense fallback={<ViewsPending />}>
          <ArticleViews slug={slug} />
        </Suspense>
        {tags.map((tag) => (
          <Link
            key={tag}
            className="meta-tag"
            href={`/tech?tag=${encodeURIComponent(tag)}`}
          >
            #{tag}
          </Link>
        ))}
      </p>
      <h1>{title}</h1>
      {description && <p className="lede">{description}</p>}
    </header>
  );
};

export default PostHeader;
