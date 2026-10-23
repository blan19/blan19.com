import Link from "next/link";

interface TagFilterProps {
  tags: [string, number][];
  total: number;
  selected?: string;
}

// 클라이언트 JS 없음. 칩은 /tech, /tech?tag=<tag> 링크다.
const TagFilter = ({ tags, total, selected }: TagFilterProps) => {
  return (
    <nav className="tag-filter" aria-label="태그 필터">
      <div className="tf-inner">
        <p className="tf-label">태그로 거르기</p>
        <div className="chips">
          <Link
            className="chip"
            href="/tech"
            aria-current={selected ? undefined : "page"}
            scroll={false}
          >
            전체 <span className="n">{total}</span>
          </Link>
          {tags.map(([tag, count]) => (
            <Link
              key={tag}
              className="chip"
              href={`/tech?tag=${encodeURIComponent(tag)}`}
              aria-current={selected === tag ? "page" : undefined}
              scroll={false}
            >
              #{tag} <span className="n">{count}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default TagFilter;
