import Icon from "@/components/ui/icon";
import NavLinks from "@/components/ui/nav-links";
import ThemeToggle from "@/components/ui/theme-toggle";
import Wordmark from "@/components/ui/wordmark";

const Header = () => {
  return (
    <header className="site-header">
      <div className="site-wrap flex items-center justify-between gap-3 pt-8 pb-2">
        <Wordmark />
        <nav aria-label="주 메뉴" className="site-nav">
          <NavLinks />
          <span className="dot-sep" aria-hidden="true" />
          <a className="icon-btn" href="/rss.xml" aria-label="RSS 피드">
            <Icon name="rss" />
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};

export default Header;
