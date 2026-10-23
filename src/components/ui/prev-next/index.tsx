import Link from "next/link";
import type { Post } from "@/lib/posts";
import { formatDotDate } from "@/lib/format-date";
import Icon from "@/components/ui/icon";

interface PrevNextProps {
  prev?: Post;
  next?: Post;
}

const PrevNext = ({ prev, next }: PrevNextProps) => {
  if (!prev && !next) return null;

  return (
    <nav className="pn" aria-label="이전 글과 다음 글">
      {prev && (
        <Link className="pn-prev" href={`/tech/${prev.slug}`} rel="prev">
          <Icon name="left" className="arr" />
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
          <Icon name="right" className="arr" />
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
  );
};

export default PrevNext;
