import { author, site } from "@/lib/config";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-wrap">
        <div className="rail-grid">
          <div className="rail-main foot">
            <span>{`© ${site.since}–${new Date().getFullYear()} ${site.name}`}</span>
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
