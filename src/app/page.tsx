import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { author, site } from "@/lib/config";
import { getLogParagraphs, getPostsNewestFirst } from "@/lib/posts";
import { formatDotDate } from "@/lib/format";
import HeroObject from "@/components/ui/hero-object";
import PostList from "@/components/ui/post-list";
import MostRead, { MostReadPending } from "@/components/ui/most-read";
import { alternates, openGraph } from "@/lib/metadata";

// 제목, 설명은 layout 기본값(사이트)을 그대로 쓴다. og:url 때문에 openGraph 만 둔다.
export const metadata: Metadata = {
  alternates: alternates("/"),
  openGraph: openGraph("/", site.title, site.description),
};

const RECENT_COUNT = 5;

// title, description 은 layout 기본값(config.site)이다.
export const metadata: Metadata = {
  alternates: alternates("/"),
  openGraph: openGraph({
    title: config.site.name,
    description: config.site.description,
    path: "/",
  }),
};

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
              소프트웨어 엔지니어 blan19입니다. 문제가 생기면 원인을 끝까지 좁히고, 알게 된 것은
              글로 남깁니다.
            </h1>
            <p className="link-row intro-links">
              <a
                className="u-link"
                href={author.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a className="u-link" href={`mailto:${author.email}`}>
                메일
              </a>
            </p>
          </div>
          <HeroObject mode="laptop" seed="blan19" animate />
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
            <p className="empty-note">아직 글이 없습니다.</p>
          )}
          <p className="more-link">
            <Link href="/tech">글 {tech.length}편 모두 보기 →</Link>
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
          팀의 일이 어디서 막히는지 살펴보고, 그 병목을 AI로 없애는 방법을 찾고
          있습니다.
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
      <JsonLd data={siteJsonLd()} />
    </div>
  );
}
