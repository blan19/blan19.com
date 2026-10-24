import Link from "next/link";
import { site } from "@/lib/config";

const Wordmark = () => {
  return (
    <Link href="/" className="wordmark" aria-label={`${site.name} 홈`}>
      {site.name}
    </Link>
  );
};

export default Wordmark;
