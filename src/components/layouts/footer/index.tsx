import Wordmark from "@/components/ui/wordmark";
import config from "@/lib/config";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-wrap">
        <div className="site-col">
          <div className="double-rule" />
          <div className="foot">
            <Wordmark size="footer" />
            <nav className="foot-links" aria-label="연락">
              <a href={config.author.link} target="_blank" rel="noopener noreferrer">
                GitHub ↗
              </a>
              <a href={`mailto:${config.author.email}`}>Email</a>
              <a href="/rss.xml">RSS</a>
            </nav>
            <div className="foot-meta">
              <span>© 2023–{new Date().getFullYear()} blan19</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
