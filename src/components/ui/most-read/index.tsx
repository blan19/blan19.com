import Link from "next/link";
import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getBestBlogPosts } from "@/lib/db/queries";
import { getBlogPosts } from "@/lib/posts";

// 홈 "많이 읽힌 글". <Suspense fallback={<MostReadPending />}> 안에서만 쓴다.
// DB 가 실패하거나 맞는 글이 없으면 섹션째 숨긴다(null).

const MostReadHead = () => (
  <>
    <div className="ab-head">
      <h2 id="h-mr" className="ab-title">
        많이 읽힌 글
      </h2>
    </div>
    <div className="double-rule double-rule-thin" />
  </>
);

const MostRead = async () => {
  await connection();

  let best: Awaited<ReturnType<typeof getBestBlogPosts>>;
  try {
    best = await getBestBlogPosts();
  } catch (error) {
    unstable_rethrow(error);
    console.error("[most-read] 많이 읽힌 글을 불러오지 못했습니다", error);
    return null;
  }

  // DB 에만 남은 slug(삭제/이름 변경된 글)는 건너뛴다.
  const posts = getBlogPosts("tech");
  const matched = best.flatMap((view) => {
    const post = posts.find((p) => p.slug === view.slug);
    return post ? [{ post, count: view.count }] : [];
  });

  if (!matched.length) return null;

  return (
    <aside className="most-read" aria-labelledby="h-mr">
      <MostReadHead />
      <ol className="mr-list">
        {matched.map(({ post, count }, i) => (
          <li key={post.slug}>
            <Link className="mr-link" href={`/tech/${post.slug}`}>
              <span className="mr-rank tnum">{i + 1}</span>
              <span className="mr-title">
                <span className="title-hl">{post.metadata.title}</span>
              </span>
              <span className="mr-views tnum">
                {count.toLocaleString("ko-KR")}회 · {post.readingMinutes}분
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
};

const MostReadPending = () => (
  <aside className="most-read" aria-labelledby="h-mr" aria-busy="true">
    <MostReadHead />
    <ol className="mr-list mr-pending" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="mr-skel">
          <span className="mr-bar" />
          <span className="mr-bar mr-bar-short" />
        </li>
      ))}
    </ol>
  </aside>
);

export { MostReadPending };
export default MostRead;
