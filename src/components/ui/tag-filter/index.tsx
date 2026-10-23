import Link from "next/link";

interface TagFilterProps {
  tags: [string, number][];
  total: number;
  selected?: string;
}

// 클라이언트 JS 없음. 한 줄 mono 링크(/tech, /tech?tag=<tag>)이고 현재 항목만 밑줄.
// 개수(.n)는 장식용 중복 정보지만 링크 이름에도 들어간다.
const TagFilter = ({ tags, total, selected }: TagFilterProps) => {
  return (
    <nav className="tag-filter" aria-label="태그 필터">
      <Link
        href="/tech"
        aria-current={selected ? undefined : "page"}
        scroll={false}
      >
        전체<span className="n">{total}</span>
      </Link>
      {tags.map(([tag, count]) => (
        <Link
          key={tag}
          href={`/tech?tag=${encodeURIComponent(tag)}`}
          aria-current={selected === tag ? "page" : undefined}
          scroll={false}
        >
          {tag}
          <span className="n">{count}</span>
        </Link>
      ))}
    </nav>
  );
};

export default TagFilter;
