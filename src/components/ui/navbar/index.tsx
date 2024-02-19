"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const links = [
  {
    name: "home",
    path: "/",
  },
  {
    name: "tech",
    path: "/tech",
  },
  {
    name: "log",
    path: "/log",
  },
];

const NavbarItem = ({ name, path }: { name: string; path: string }) => {
  let pathname = usePathname() || "/";
  if (pathname.includes("/tech/")) {
    pathname = "/tech";
  }

  const isActive = path === pathname;

  return (
    <Link href={path}>
      <span className="relative">
        {name}
        {isActive && (
          <div className="absolute w-full h-[1px] top-6 inset-0 bg-greyscale-5 dark:bg-greyscale-7" />
        )}
      </span>
    </Link>
  );
};

const Navbar = () => {
  return (
    <aside>
      <nav className="flex gap-3">
        <Suspense fallback={null}>
          {links.map((link) => (
            <NavbarItem key={link.path} {...link} />
          ))}
        </Suspense>
      </nav>
    </aside>
  );
};

export default Navbar;
