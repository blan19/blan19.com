import Link from "next/link";
import { Suspense } from "react";
import type { Post } from "@/lib/posts";
import { formatDotDate, formatMonthDay } from "@/lib/format-date";
import { RowViews } from "@/components/ui/view-count";

interface PostRowProps {
  post: Post;
  variant: "compact" | "full";
  isNewest: boolean;
}

// 행은 파일시스템 데이터로 완결된다. 조회수 칸만 DB(RowViews)라 실패하거나 느리면 비어 있다.
const PostRow = ({ post, variant, isNewest }: PostRowProps) => {
  const { slug, index, readingMinutes, metadata } = post;
  const { title, description, publishedAt, tags } = metadata;

  return (
    <li>
      <Link className="post-row" href={`/tech/${slug}`}>
        <span className="row-num" aria-hidden="true">
          {String(index).padStart(2, "0")}
        </span>
        <span className="row-line">
          <span className="row-title">
            {isNewest && <span className="badge-new">새 글</span>}
            <span className="title-hl">{title}</span>
          </span>
          <span className="leader" aria-hidden="true" />
          {/* full(/tech)은 날짜를 메타 줄에 전체 형식으로 두므로 읽는 시간만(B 목업 rowHTML) */}
          <span className="row-read">
            {variant === "compact" && (
              <>
                <time dateTime={publishedAt}>{formatMonthDay(publishedAt)}</time> ·{" "}
              </>
            )}
            {readingMinutes}분
          </span>
        </span>
        <span className="row-desc">{description}</span>
        <span className="row-meta">
          {variant === "full" && (
            <time dateTime={publishedAt}>{formatDotDate(publishedAt)}</time>
          )}
          {tags.length > 0 && (
            <span className="row-tags">
              {tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </span>
          )}
          <Suspense fallback={null}>
            <RowViews slug={slug} />
          </Suspense>
        </span>
      </Link>
    </li>
  );
};

export default PostRow;
