import config from "@/lib/config";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-wrap">
        <div className="rail-grid">
          <div className="rail-main foot">
            <span>© 2023–{new Date().getFullYear()} blan19</span>
            <nav aria-label="연락처와 RSS">
              <a href={config.author.link} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href={`mailto:${config.author.email}`}>메일</a>
              <a href="/rss.xml">RSS</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
