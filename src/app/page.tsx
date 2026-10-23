import Link from "next/link";
import { Suspense } from "react";
import config from "@/lib/config";
import { getLogParagraphs, getPostsNewestFirst } from "@/lib/posts";
import { formatDotDate } from "@/lib/format-date";
import HeroObject from "@/components/ui/hero-object";
import PostList from "@/components/ui/post-list";
import MostRead, { MostReadPending } from "@/components/ui/most-read";

const RECENT_COUNT = 5;

export default function Home() {
  const tech = getPostsNewestFirst("tech");
  const log = getPostsNewestFirst("log");
  const recent = tech.slice(0, RECENT_COUNT);
  const latestLog = log[0];
  const latestLogQuote = latestLog
    ? getLogParagraphs(latestLog.content)[0]
    : undefined;

  return (
    <div className="site-wrap">
      <section className="rail-grid home-intro" aria-labelledby="home-h1">
        <div className="rail-main intro-body">
          <div>
            <h1 id="home-h1" className="intro-h1">
              화면 뒤의 구조를 글로 정리하는 프론트엔드 엔지니어, blan19입니다.
            </h1>
            <p className="link-row intro-links">
              <a
                className="u-link"
                href={config.author.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a className="u-link" href={`mailto:${config.author.email}`}>
                메일
              </a>
              <a className="u-link" href="/rss.xml">
                RSS
              </a>
            </p>
          </div>
          <HeroObject mode="knot" seed="blan19" animate />
        </div>
      </section>

      <section className="rail-grid home-sec" aria-labelledby="h-posts">
        <h2 className="rail-side rail-label" id="h-posts">
          최근 글
        </h2>
        <div className="rail-main">
          {recent.length > 0 ? (
            <PostList posts={recent} variant="home" />
          ) : (
            <p className="empty-note">아직 글이 없어요.</p>
          )}
          <p className="more-link">
            <Link href="/tech">전체 {tech.length}편 →</Link>
          </p>
        </div>
      </section>

      <Suspense fallback={<MostReadPending />}>
        <MostRead />
      </Suspense>

      <section className="rail-grid home-sec" aria-labelledby="h-now">
        <h2 className="rail-side rail-label" id="h-now">
          요즘
        </h2>
        <p className="rail-main now-line">
          TypeScript와 Next.js로 화면을 만들며 렌더링의 내부를 들여다보고,
          WebGL·three.js와 Rust·Flutter를 익히고 있습니다.
        </p>
      </section>

      {latestLog && (
        <section className="rail-grid home-sec" aria-labelledby="h-log">
          <h2 className="rail-side rail-label" id="h-log">
            최근 기록
          </h2>
          <div className="rail-main">
            <Link className="log-line" href="/log">
              <span className="ll-head">
                <time dateTime={latestLog.metadata.publishedAt}>
                  {formatDotDate(latestLog.metadata.publishedAt)}
                </time>
                <span className="ll-title">{latestLog.metadata.title}</span>
              </span>
              {latestLogQuote && (
                <span className="ll-ex">{latestLogQuote}</span>
              )}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
