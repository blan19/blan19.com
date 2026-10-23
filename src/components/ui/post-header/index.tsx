import Link from "next/link";
import { Suspense } from "react";
import type { Post } from "@/lib/posts";
import { formatDotDate } from "@/lib/format-date";
import ArticleViews, { ViewsPending } from "@/components/ui/view-count";

interface PostHeaderProps {
  post: Post;
}

// id="post-head" 는 TocSpy(모바일 pill 표시 시점)가 찾는다.
const PostHeader = ({ post }: PostHeaderProps) => {
  const { slug, readingMinutes, metadata } = post;
  const { title, description, publishedAt, tags } = metadata;

  return (
    <header className="post-head" id="post-head">
      <p className="post-meta">
        {tags.map((tag) => (
          <Link
            key={tag}
            className="tag-eyebrow"
            href={`/tech?tag=${encodeURIComponent(tag)}`}
          >
            #{tag}
          </Link>
        ))}
        {tags.length > 0 && <span className="meta-sep" aria-hidden="true" />}
        <time dateTime={publishedAt} className="mono tnum">
          {formatDotDate(publishedAt)}
        </time>
        <span className="meta-sep" aria-hidden="true" />
        <span>{readingMinutes}분 읽기</span>
        <Suspense fallback={<ViewsPending />}>
          <ArticleViews slug={slug} />
        </Suspense>
      </p>
      <h1>{title}</h1>
      {description && <p className="lede">{description}</p>}
      <div className="double-rule" />
    </header>
  );
};

export default PostHeader;
