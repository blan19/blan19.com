import Footer from "./footer";
import Header from "./header";
import type { ReactNode } from "react";
import styled from "styled-components";

interface Props {
  children: ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <>
      <Header />
      <HeaderSpace />
      <main>{children}</main>
      <FooterSpace />
      <Footer />
    </>
  );
};

export default Layout;

const HeaderSpace = styled.div`
  width: 100%;
  height: 50px;
`;

const FooterSpace = styled.div`
  width: 100%;
  height: 55px;
`;
