import styled from "styled-components";
import { CSSElement } from "../../types/styles";

const Flex = ({ children }: CSSElement) => {
  return <FlexBase>{children}</FlexBase>;
};

export default Flex;

const FlexBase = styled.div<CSSElement>`
  display: flex;
  justify-content: ${({ _justifyContent }) =>
    _justifyContent && _justifyContent};
  align-items: ${({ _alignItems }) => _alignItems && _alignItems};
  gap: ${({ _gap }) => _gap && _gap};
  width: ${({ _width }) => _width && _width};
  height: ${({ _height }) => _height && _height};
`;
