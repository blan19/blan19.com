import styled from "styled-components";
import { FunctionComponent } from "react";
import NavLink from "../navLink";
import HomeIcon from "../../assets/svg/home.svg";
import FilesIcon from "../../assets/svg/files.svg";
import DailyIcon from "../../assets/svg/daily.svg";

const Footer: FunctionComponent = () => {
  return (
    <Base>
      <Wrapper>
        <NavLink href="/">
          <NavLinkOutline>
            <HomeIcon />
            <span>Home</span>
          </NavLinkOutline>
        </NavLink>
        <NavLink href="/posts">
          <NavLinkOutline>
            <FilesIcon />
            <span>Posts</span>
          </NavLinkOutline>
        </NavLink>
        <NavLink href="/daily">
          <NavLinkOutline>
            <DailyIcon />
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
  background-color: ${({ theme }) => theme.colors.sub};
  z-index: 999;
  width: 100%;
  left: 0;
  bottom: 0;
`;

const Wrapper = styled.nav`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
  color: ${({ theme }) => theme.colors.gray_1};
  font-size: ${({ theme }) => theme.fontSize.body2r_mobile};
  font-weight: 400;
  .active {
    fill: ${({ theme }) => theme.colors.font};
    color: ${({ theme }) => theme.colors.font};
    font-weight: 500;
  }
`;

const NavLinkOutline = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0;
  gap: 0.5rem;
  fill: ${({ theme }) => theme.colors.gray_1};
  cursor: pointer;
  &:hover {
    fill: ${({ theme }) => theme.colors.font};
    color: ${({ theme }) => theme.colors.font};
  }
`;
