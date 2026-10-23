import Link from "next/link";
import type { Post } from "@/lib/posts";
import { formatDotDate } from "@/lib/format";

interface PrevNextProps {
  prev?: Post;
  next?: Post;
}

// 글 끝 섹션(.end-sec)째 렌더한다. 이전/다음 글이 모두 없으면 아무것도 그리지 않는다.
const PrevNext = ({ prev, next }: PrevNextProps) => {
  if (!prev && !next) return null;

  return (
    <div className="end-sec pn-wrap">
      <nav className="pn" aria-label="이전 글과 다음 글">
        {prev && (
          <Link className="pn-prev" href={`/tech/${prev.slug}`} rel="prev">
            <span className="pn-l">
              이전 글{" "}
              <span className="mono tnum pn-d">
                {formatDotDate(prev.metadata.publishedAt)}
              </span>
            </span>
            <span className="pn-t">{prev.metadata.title}</span>
          </Link>
        )}
        {next && (
          <Link className="pn-next" href={`/tech/${next.slug}`} rel="next">
            <span className="pn-l">
              다음 글{" "}
              <span className="mono tnum pn-d">
                {formatDotDate(next.metadata.publishedAt)}
              </span>
            </span>
            <span className="pn-t">{next.metadata.title}</span>
          </Link>
        )}
      </nav>
    </div>
  );
};

export default PrevNext;
