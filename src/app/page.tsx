import Link from "next/link";
import { Suspense } from "react";
import config from "@/lib/config";
import { getLogParagraphs, getPostsNewestFirst } from "@/lib/posts";
import type { Post } from "@/lib/posts";
import { formatDotDate, formatYearMonth } from "@/lib/format-date";
import Seal from "@/components/ui/seal";
import PostList from "@/components/ui/post-list";
import MostRead, { MostReadPending } from "@/components/ui/most-read";

const RECENT_COUNT = 5;

const pad2 = (n: number) => String(n).padStart(2, "0");

// "글 07편 · 기록 01편 · 2023.12 – 2024.05". 글이 하나도 없으면 기간은 생략한다.
const countLine = (tech: Post[], log: Post[]) => {
  const dates = [...tech, ...log]
    .map((post) => post.metadata.publishedAt)
    .sort();
  const items = [`글 ${pad2(tech.length)}편`, `기록 ${pad2(log.length)}편`];
  if (dates.length > 0) {
    items.push(
      `${formatYearMonth(dates[0])} – ${formatYearMonth(dates[dates.length - 1])}`,
    );
  }
  return items;
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
      <section className="site-col letter" aria-labelledby="home-h1">
        <p className="kicker eyebrow">blan19 · 프론트엔드 엔지니어</p>
        <h1 id="home-h1" className="letter-lead">
          안녕하세요, 화면 뒤의 구조를 글로 정리하는 프론트엔드 엔지니어
          blan19입니다.
        </h1>
        <p className="letter-body">
          TypeScript와 Next.js로 웹을 만들고, WebGL과 three.js, Rust,
          Flutter처럼 화면 너머의 것들을 공부합니다.
        </p>
        <p className="letter-body">
          이해한 것을 차근차근 풀어 쓴 글과, 글이 되기 전의 짧은 기록을 이곳에
          모읍니다.
        </p>
        <p className="letter-links">
          <a
            className="pen ext"
            href={config.author.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a className="pen" href={`mailto:${config.author.email}`}>
            메일 보내기
          </a>
          <a className="pen" href="/rss.xml">
            RSS 구독
          </a>
        </p>
        <p className="count-line">
          {countLine(tech, log).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </p>
        <div className="signoff" aria-hidden="true">
          <span className="rule" />
          blan19 드림 <Seal size="lg" />
        </div>
      </section>

      <section
        className="site-col home-section home-toc"
        aria-labelledby="h-toc"
      >
        <div className="sec-head">
          <h2 id="h-toc" className="sec-title">
            최근 글
          </h2>
          <Link className="text-link" href="/tech">
            전체 글 보기 →
          </Link>
        </div>
        {recent.length > 0 ? (
          <PostList
            posts={recent}
            variant="compact"
            newestSlug={recent[0].slug}
            yearHeading="h3"
          />
        ) : (
          <p className="empty-note">아직 글이 없어요.</p>
        )}
        <Suspense fallback={<MostReadPending />}>
          <MostRead />
        </Suspense>
      </section>

      <section className="site-col home-section now" aria-labelledby="h-now">
        <div className="sec-head">
          <h2 id="h-now" className="sec-title">
            요즘
          </h2>
        </div>
        <p>
          주로 <mark>TypeScript</mark>와 <mark>Next.js</mark>로 화면을 만들며,
          프레임워크가 내부에서 어떻게 렌더링하는지 들여다보는 일에 관심이
          많습니다.
        </p>
        <p>
          WebGL과 three.js로 그래픽스 파이프라인을, Rust와 Flutter로 웹 바깥의
          도구를 익히고 있습니다. 오픈소스 코드를 읽으며 배운 것도 이곳에
          정리할 생각입니다.
        </p>
      </section>

      {latestLog && (
        <section className="site-col home-section" aria-labelledby="h-log">
          <div className="sec-head">
            <h2 id="h-log" className="sec-title">
              최근 기록
            </h2>
            <Link className="text-link" href="/log">
              기록 전체 →
            </Link>
          </div>
          <Link className="log-card" href="/log">
            {latestLogQuote && <blockquote>{latestLogQuote}</blockquote>}
            <div className="lc-meta">
              <span className="mono tnum">
                {formatDotDate(latestLog.metadata.publishedAt)}
              </span>
              <span>{latestLog.metadata.title}</span>
              <span className="lc-go">읽기 →</span>
            </div>
          </Link>
        </section>
      )}
    </div>
  );
}
