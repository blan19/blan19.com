import { author, site } from "@/lib/config";

// 끝 연도는 빌드한 해(next.config.js 의 env.BUILD_YEAR, 빌드 때 인라인)다. 현재 시각(new Date())은 prerender 에서 쓸 수 없다(Cache Components).
const copyrightYears = () => {
  const built = Number(process.env.BUILD_YEAR) || site.since;
  return built > site.since ? `${site.since}–${built}` : `${site.since}`;
};

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-wrap">
        <div className="rail-grid">
          <div className="rail-main foot">
            <span>{`© ${copyrightYears()} ${site.name}`}</span>
            <nav aria-label="연락처와 RSS">
              <a href={author.link} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href={`mailto:${author.email}`}>메일</a>
              <a href="/rss.xml">RSS</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
