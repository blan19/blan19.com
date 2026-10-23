import Link from "next/link";
import HeroObject from "@/components/ui/hero-object";

// 흩어진 매듭은 서버 SVG 하나(캔버스 없음, JS 없음).
export default function NotFound() {
  return (
    <div className="site-wrap">
      <div className="rail-grid page-head">
        <div className="rail-main nf">
          <div>
            <p className="code-label">404</p>
            <h1 className="page-h1">페이지를 찾을 수 없습니다</h1>
            <p className="page-lede">주소가 잘못되었거나 글이 삭제되었을 수 있습니다.</p>
            <p className="link-row nf-links">
              <Link href="/" className="u-link">
                홈으로
              </Link>
              <Link href="/tech" className="u-link">
                글 목록
              </Link>
            </p>
          </div>
          <HeroObject mode="scatter" seed="404" />
        </div>
      </div>
    </div>
  );
}
