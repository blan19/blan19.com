import type { ReactNode } from "react";
import Icon from "@/components/ui/icon";
import { CALLOUT_LABELS } from "@/lib/markdown/types";
import type { CalloutType } from "@/lib/markdown/types";

interface CalloutProps {
  type: CalloutType;
  children: ReactNode;
}

const Callout = ({ type, children }: CalloutProps) => {
  return (
    <aside className="callout" data-type={type} role="note">
      <p className="callout-head">
        <Icon name={type} />
        {CALLOUT_LABELS[type]}
      </p>
      {children}
    </aside>
  );
};

export default Callout;
