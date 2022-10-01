import type { LinkProps } from "next/link";
import Link from "next/link";
import { useRouter } from "next/router";
import { Children, cloneElement } from "react";

interface NavLinkProps extends React.PropsWithChildren<LinkProps> {
  activeClassName?: string;
}

const NavLink = ({
  children,
  activeClassName = "active",
  ...props
}: NavLinkProps) => {
  const { pathname } = useRouter();
  const child = Children.only(children) as React.ReactElement;
  const childClassName = child.props.className || "";

  const className =
    pathname === props.href || pathname === props.as
      ? `${childClassName} ${activeClassName}`.trim()
      : childClassName;

  return (
    <Link {...props}>
      {cloneElement(child, {
        className: className || null,
      })}
    </Link>
  );
};

export default NavLink;
