import { getLogParagraphs, getPostsNewestFirst } from "@/lib/posts";
import { formatDotDate } from "@/lib/format-date";

// 마크다운 렌더 없이 원문 문단을 그대로 보여 준다. DB 를 쓰지 않는 정적 페이지다.
// 날짜는 레일(≥1280)에, 그 아래에서는 제목 위에 온다.
const Log = () => {
  const posts = getPostsNewestFirst("log");

  return (
    <div className="site-wrap">
      <header className="rail-grid page-head">
        <div className="rail-main">
          <h1 className="page-h1">기록</h1>
          <p className="page-lede">
            짧은 생각과 일상을 적습니다.
          </p>
        </div>
      </header>

      {posts.length === 0 && (
        <div className="rail-grid">
          <p className="rail-main empty-note">아직 기록이 없습니다.</p>
        </div>
      )}

      {posts.map(({ slug, metadata, content }) => (
        <article
          key={slug}
          className="rail-grid log-entry"
          aria-labelledby={`log-${slug}`}
        >
          <p className="rail-side rail-label log-date">
            <time dateTime={metadata.publishedAt}>
              {formatDotDate(metadata.publishedAt)}
            </time>
          </p>
          <div className="rail-main">
            <h2 id={`log-${slug}`} className="log-h2">
              {metadata.title}
            </h2>
            <div className="log-body">
              {getLogParagraphs(content).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            {metadata.tags.length > 0 && (
              <p className="log-tags">
                {metadata.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default Log;
