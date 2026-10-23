import NavLinks from "@/components/ui/nav-links";
import ThemeToggle from "@/components/ui/theme-toggle";
import Wordmark from "@/components/ui/wordmark";

const Header = () => {
  return (
    <header className="site-header">
      <div className="site-wrap">
        <div className="rail-grid head-grid">
          <div className="rail-side">
            <Wordmark />
          </div>
          <nav aria-label="주 메뉴" className="rail-main site-nav">
            <NavLinks />
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
