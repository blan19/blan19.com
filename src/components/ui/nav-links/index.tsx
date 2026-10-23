"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "글", path: "/tech" },
  { name: "기록", path: "/log" },
];

const NavLinks = () => {
  const pathname = usePathname() ?? "/";

  return (
    <>
      {links.map(({ name, path }) => {
        const isCurrent = pathname === path || pathname.startsWith(`${path}/`);
        return (
          <Link
            key={path}
            href={path}
            className="nav-link"
            aria-current={isCurrent ? "page" : undefined}
          >
            {name}
          </Link>
        );
      })}
    </>
  );
};

export default NavLinks;
