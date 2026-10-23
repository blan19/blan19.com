import Icon from "@/components/ui/icon";
import type { TocItem } from "@/lib/markdown/types";

interface TocProps {
  items: TocItem[];
}

// 목차 링크 목록. TocSpy 가 [data-toc] a 의 active/read 클래스를 직접 바꾼다.
const TocList = ({ items }: TocProps) => {
  return (
    <ol className="toc-list" data-toc>
      {items.map((item) => (
        <li key={item.id} className={item.depth === 2 ? "lv2" : "lv3"}>
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
      <summary>
        <span>목차</span>
        <span className="cnt">· {items.length}</span>
        <Icon name="chev" className="chev" />
      </summary>
      <TocList items={items} />
    </details>
  );
};

// 1280px 이상에서 본문 왼쪽 여백에 붙는 목차 레일.
const TocRail = ({ items }: TocProps) => {
  if (items.length === 0) return null;
  return (
    <aside className="toc-rail">
      <nav aria-label="목차">
        <p className="toc-label">
          목차 <span className="cnt">{items.length}</span>
          <span className="pct" data-toc-pct>
            0%
          </span>
        </p>
        <div className="toc-track" data-toc-track>
          <span className="rail-line" />
          <span className="rail-fill" />
          <span className="rail-dot" />
          <TocList items={items} />
        </div>
      </nav>
    </aside>
  );
};

export { TocDetails, TocList };
export default TocRail;
