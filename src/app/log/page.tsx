import {
  getLogParagraphs,
  getPostsNewestFirst,
} from "@/lib/posts";
import {
  formatDotDate,
  formatYearMonth,
  koreanWeekday,
} from "@/lib/format-date";
import Seal from "@/components/ui/seal";

// 마크다운 렌더 없이 원문 문단을 그대로 보여 준다. DB 를 쓰지 않는 정적 페이지다.
const Log = () => {
  const posts = getPostsNewestFirst("log");
  const oldest = posts[posts.length - 1];

  return (
    <div className="site-wrap">
      <header className="site-col log-head">
        <p className="kicker">log / 짧은 기록</p>
        <h1 className="page-title">기록</h1>
        <p className="page-lede">
          글이 되기 전의 생각과, 매일 쌓아 가는 습관을 짧게 남깁니다.
        </p>
        <p className="count-line">
          <span>{String(posts.length).padStart(2, "0")}편</span>
          {oldest && (
            <span>{formatYearMonth(oldest.metadata.publishedAt)} –</span>
          )}
        </p>
        <div className="double-rule" />
      </header>

      {posts.length === 0 && (
        <p className="site-col empty-note">아직 기록이 없어요.</p>
      )}

      {posts.map(({ slug, metadata, content }) => (
        <article
          key={slug}
          className="site-col log-entry"
          aria-labelledby={`log-${slug}`}
        >
          <p className="log-date">
            <time dateTime={metadata.publishedAt}>
              {formatDotDate(metadata.publishedAt)}
            </time>
            <span className="dow">{koreanWeekday(metadata.publishedAt)}</span>
          </p>
          <h2 id={`log-${slug}`}>{metadata.title}</h2>
          {metadata.tags.length > 0 && (
            <p className="l-tags">
              {metadata.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </p>
          )}
          <div className="log-body">
            {getLogParagraphs(content).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </article>
      ))}

      {posts.length > 0 && (
        <div className="site-col log-end">
          <Seal size="end" />
          <span>기록은 계속됩니다</span>
          <span className="rule" aria-hidden="true" />
        </div>
      )}
    </div>
  );
};

export default Log;
