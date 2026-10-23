import type { TocItem } from "@/lib/markdown/types";

interface TocProps {
  items: TocItem[];
}

// 목차 링크 목록. TocSpy 가 [data-toc] a 의 active 클래스와 aria-current 를 직접 바꾼다.
const TocList = ({ items }: TocProps) => {
  return (
    <ol className="toc-list" data-toc>
      {items.map((item) => (
        <li key={item.id} className={item.depth === 3 ? "lv3" : undefined}>
          <a href={`#${item.id}`} data-id={item.id}>
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );
};

// 1280px 미만에서 글 머리 아래에 접혀 있는 목차.
const TocDetails = ({ items }: TocProps) => {
  if (items.length === 0) return null;
  return (
    <details className="toc-details">
      <summary>목차</summary>
      <TocList items={items} />
    </details>
  );
};

// 1280px 이상에서 왼쪽 레일에 붙는 목차.
const TocRail = ({ items }: TocProps) => {
  if (items.length === 0) return null;
  return (
    <aside className="rail-side toc-rail">
      <nav aria-label="목차">
        <p className="toc-label">목차</p>
        <TocList items={items} />
      </nav>
    </aside>
  );
};

export { TocDetails, TocList };
export default TocRail;
