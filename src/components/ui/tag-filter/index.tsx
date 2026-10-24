import Link from "next/link";

interface TagFilterProps {
  tags: [string, number][];
  total: number;
  selected?: string;
  // Suspense fallback(정적 셸)일 때. 아직 고른 태그를 모르므로 어느 항목도 현재로 표시하지 않는다.
  pending?: boolean;
}

// 클라이언트 JS 없음. 한 줄 mono 링크(/tech, /tech?tag=<tag>)이고 현재 항목만 밑줄.
// 개수(.n)는 장식용 중복 정보지만 링크 이름에도 들어간다.
const TagFilter = ({ tags, total, selected, pending }: TagFilterProps) => {
  return (
    <nav className="tag-filter" aria-label="태그 필터">
      <Link
        href="/tech"
        aria-current={selected || pending ? undefined : "page"}
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
