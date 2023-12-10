import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/ui/navbar";
import logo from "../../../../public/image/memoji-min.png";

const Header = () => {
  return (
    <header className="sticky w-full z-[999] bg-greyscale-0 dark:bg-greyscale-9">
      <div className="responsive flex justify-between">
        <Link href="/">
          <div className="flex items-center">
            <Image placeholder="blur" alt="logo" src={logo} />
            <h2 className="text-xl font-medium tracking-tighter">blan19</h2>
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
