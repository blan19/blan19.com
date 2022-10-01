import styled from "styled-components";
import { CSSElement } from "../../types/styles";

const FlexCol = ({ children }: CSSElement) => {
  return <FlexColBase>{children}</FlexColBase>;
};

export default FlexCol;

const FlexColBase = styled.div<CSSElement>`
  display: flex;
  flex-direction: column;
  justify-content: ${({ _justifyContent }) =>
    _justifyContent && _justifyContent};
  align-items: ${({ _alignItems }) => _alignItems && _alignItems};
  gap: ${({ _gap }) => _gap && _gap};
  width: ${({ _width }) => _width && _width};
  height: ${({ _height }) => _height && _height};
`;
