import Link from "next/link";
import Seal from "@/components/ui/seal";

interface WordmarkProps {
  size?: "header" | "footer";
}

const Wordmark = ({ size }: WordmarkProps) => {
  const isFooter = size === "footer";

  return (
    <Link
      href="/"
      className={isFooter ? "wordmark wordmark-sm" : "wordmark"}
      aria-label="blan19 홈"
    >
      blan19 <Seal size={isFooter ? "sm" : "md"} />
    </Link>
  );
};

export default Wordmark;
