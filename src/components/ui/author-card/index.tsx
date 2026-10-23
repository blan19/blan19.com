import Seal from "@/components/ui/seal";

const AuthorCard = () => {
  return (
    <div className="author">
      <Seal size="xl" />
      <div>
        <p className="a-name">blan19</p>
        <p className="a-role">
          프론트엔드 엔지니어. 화면 뒤의 구조를 글로 정리합니다.
        </p>
        <p className="a-links">
          <a
            className="pen ext"
            href="https://github.com/blan19"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a className="pen" href="/rss.xml">
            RSS
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthorCard;
