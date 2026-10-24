import Link from "next/link";
import { Suspense } from "react";
import type { Post } from "@/lib/posts";
import { formatDotDate, formatMonthDay } from "@/lib/format";
import { RowViews } from "@/components/ui/view-count";

interface PostRowProps {
  post: Post;
  // full: "2024.03.26"(홈), month-day: "03.26"(/tech, 연도 라벨 아래)
  date: "full" | "month-day";
  // desktop: 한 줄 말줄임, <768 에서 숨김(홈) / always: 줄바꿈해서 항상 보임(/tech)
  desc: "desktop" | "always";
  views: boolean;
}

// 색인 행: 날짜 · 제목(+설명) · 읽는 시간. 조회수 칸만 DB(RowViews)라 실패하거나 느리면 비어 있다.
const PostRow = ({ post, date, desc, views }: PostRowProps) => {
  const { slug, readingMinutes, metadata } = post;
  const { title, description, publishedAt } = metadata;

  return (
    <li>
      <Link className="idx-row" href={`/tech/${slug}`}>
        <time className="idx-date" dateTime={publishedAt}>
          {date === "full" ? formatDotDate(publishedAt) : formatMonthDay(publishedAt)}
        </time>
        <span className="idx-main">
          <span className="idx-title">{title}</span>
          {description && (
            <span className={desc === "desktop" ? "idx-desc is-desktop" : "idx-desc"}>
              {description}
            </span>
          )}
        </span>
        <span className="idx-read">
          {readingMinutes}분
          {views && (
            <Suspense fallback={null}>
              <RowViews slug={slug} />
            </Suspense>
          )}
        </span>
      </Link>
    </li>
  );
};

export default PostRow;
