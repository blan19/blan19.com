import Link from "next/link";

export default function NotFound() {
  return (
    <div className="site-wrap">
      <div className="site-col">
        <p className="kicker">404</p>
        <h1 className="page-title mt-3">페이지를 찾을 수 없어요</h1>
        <p className="page-lede">주소가 바뀌었거나 없는 글이에요.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-outline">
            홈으로
          </Link>
          <Link href="/tech" className="btn-outline">
            글 목록
          </Link>
        </div>
      </div>
    </div>
  );
}
