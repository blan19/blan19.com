import type { ReactNode } from "react";
import Icon from "@/components/ui/icon";
import type { CalloutType } from "@/lib/markdown/types";

interface CalloutProps {
  type: CalloutType;
  children: ReactNode;
}

const LABELS: Record<CalloutType, string> = {
  note: "참고",
  tip: "팁",
  important: "중요",
  warning: "주의",
  caution: "경고",
};

const Callout = ({ type, children }: CalloutProps) => {
  return (
    <aside className="callout" data-type={type} role="note">
      <p className="callout-head">
        <Icon name={type} />
        {LABELS[type]}
      </p>
      {children}
    </aside>
  );
};

export default Callout;
