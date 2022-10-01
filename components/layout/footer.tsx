import styled from "styled-components";
import React, { FunctionComponent } from "react";
import NavLink from "../navLink";

const Footer: FunctionComponent = () => {
  return (
    <Base>
      <Wrapper>
        <NavLink href="/">
          <NavLinkOutline>
            <span>Home</span>
          </NavLinkOutline>
        </NavLink>
        <NavLink href="/posts">
          <NavLinkOutline>
            <span>Posts</span>
          </NavLinkOutline>
        </NavLink>
        <NavLink href="/daily">
          <NavLinkOutline>
            <span>Daily</span>
          </NavLinkOutline>
        </NavLink>
      </Wrapper>
    </Base>
  );
};

export default Footer;

const Base = styled.footer`
  position: fixed;
  z-index: 999;
  width: 100%;
  left: 0;
  bottom: 0;
`;

const Wrapper = styled.nav`
  width: 100%;
  .active {
    color: #cc5de8;
    font-weight: bold;
  }
  box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
`;

const NavLinkOutline = styled.div``;
