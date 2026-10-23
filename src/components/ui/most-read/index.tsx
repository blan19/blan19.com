import Link from "next/link";
import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import type { ReactNode } from "react";
import { getMostRead } from "@/lib/views";
import { formatViews } from "@/lib/format";

// 홈 "많이 읽힌 글". <Suspense fallback={<MostReadPending />}> 안에서만 쓴다.
// 섹션 전체를 렌더하므로 DB 가 실패하거나 맞는 글이 없으면 섹션째 사라진다(null).

const MostReadSection = ({
  busy,
  children,
}: {
  busy?: boolean;
  children: ReactNode;
}) => (
  <section
    className="rail-grid home-sec"
    aria-labelledby="h-mr"
    aria-busy={busy || undefined}
  >
    <h2 className="rail-side rail-label" id="h-mr">
      많이 읽힌 글
    </h2>
    <div className="rail-main">{children}</div>
  </section>
);

const MOST_READ_COUNT = 3;

const MostRead = async () => {
  await connection();

  let matched: Awaited<ReturnType<typeof getMostRead>>;
  try {
    matched = await getMostRead(MOST_READ_COUNT);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[most-read] 많이 읽힌 글을 불러오지 못했습니다", error);
    return null;
  }

  if (!matched.length) return null;

  return (
    <MostReadSection>
      <ol className="idx-list is-ranked">
        {matched.map(({ post, count }, i) => (
          <li key={post.slug}>
            <Link className="idx-row" href={`/tech/${post.slug}`}>
              <span className="idx-date">{i + 1}</span>
              <span className="idx-main">
                <span className="idx-title">{post.metadata.title}</span>
              </span>
              <span className="idx-read">{formatViews(count)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </MostReadSection>
  );
};

// 로딩 중 자리 표시: 실제 행과 같은 높이의 막대 3줄(레이아웃 이동 없음)
const MostReadPending = () => (
  <MostReadSection busy>
    <ol className="idx-list is-pending" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="idx-skel">
          <span className="skel-bar" />
        </li>
      ))}
    </ol>
  </MostReadSection>
);

export { MostReadPending };
export default MostRead;
