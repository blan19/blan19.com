import Link from "next/link";
import Navbar from "@/components/ui/navbar";

const Header = () => {
  return (
    <header className="sticky w-full z-[999] bg-greyscale-0 dark:bg-greyscale-9">
      <div className="responsive flex justify-between py-2">
        <Link href="/">
          <div className="flex items-center">
            <h2 className="text-xl font-medium tracking-tighter italic">
              blan19.com
            </h2>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Navbar />
        </div>
      </div>
    </header>
  );
};

export default Header;
