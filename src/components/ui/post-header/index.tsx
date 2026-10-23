import Link from "next/link";
import { Suspense } from "react";
import type { Post } from "@/lib/posts";
import { formatDotDate } from "@/lib/format-date";
import ArticleViews, { ViewsPending } from "@/components/ui/view-count";

interface PostHeaderProps {
  post: Post;
}

// id="post-head" 는 TocSpy(모바일 pill 표시 시점)가 찾는다.
// 메타 줄: 날짜 · 읽는 시간 · 조회수 · #태그(글의 태그는 여기에만 있다).
const PostHeader = ({ post }: PostHeaderProps) => {
  const { slug, readingMinutes, metadata } = post;
  const { title, description, publishedAt, tags } = metadata;

  return (
    <header className="rail-main post-head" id="post-head">
      <p className="post-meta">
        <time dateTime={publishedAt}>{formatDotDate(publishedAt)}</time>
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
