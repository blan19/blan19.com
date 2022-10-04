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
      <Base>{children}</Base>
      <Footer />
    </>
  );
};

export default Layout;

const Base = styled.main`
  height: 100%;
`;
