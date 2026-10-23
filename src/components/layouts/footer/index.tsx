import { author, site } from "@/lib/config";
import { getLatestPublishedAt } from "@/lib/posts";

// 끝 연도는 가장 최근 글(tech, log)의 연도다. 현재 시각(new Date())은 prerender 에서 쓸 수 없고(Cache Components),
// 정적 라우트와 요청 시점 라우트의 연도가 해가 바뀐 뒤 어긋났다. 이 값은 모든 라우트에서 같고 글을 올릴 때만 바뀐다.
const copyrightYears = () => {
  const latest = Number(getLatestPublishedAt("tech", "log")?.slice(0, 4) ?? site.since);
  return latest > site.since ? `${site.since}–${latest}` : `${site.since}`;
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
