import type { ReactNode } from "react";
import styled from "styled-components";

interface Props {
  children: ReactNode;
}

const FlexCol = ({ children }: Props) => {
  return <FlexColBase>{children}</FlexColBase>;
};

export default FlexCol;

const FlexColBase = styled.div`
  display: flex;
  flex-direction: column;
`;
