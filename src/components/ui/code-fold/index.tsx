"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import Icon from "@/components/ui/icon";

interface CodeFoldProps {
  lines: number;
}

// 30줄이 넘는 코드 블록의 접힘 토글. 접힘 상태는 figure 의 data-collapsed 로 CSS 가 그린다.
const CodeFold = ({ lines }: CodeFoldProps) => {
  const [expanded, setExpanded] = useState(false);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const figure = event.currentTarget.closest("figure");
    const next = !expanded;
    setExpanded(next);
    if (!figure) return;
    figure.toggleAttribute("data-collapsed", !next);
    if (!next && figure.getBoundingClientRect().top < 0) {
      figure.scrollIntoView({ block: "nearest" });
    }
  };

  return (
    <div className="code-more">
      <button type="button" aria-expanded={expanded} onClick={handleClick}>
        {expanded ? (
          "접기"
        ) : (
          <span>
            <span className="mono">{lines}</span>줄 모두 보기
          </span>
        )}
        <Icon name="chev" />
      </button>
    </div>
  );
};

export default CodeFold;
