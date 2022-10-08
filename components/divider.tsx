import styled from "styled-components";

interface Props {
  _margin?: string;
  _height?: string;
  _color?: string;
}

const Divider = (props: Props) => {
  return <Base {...props}></Base>;
};

export default Divider;

const Base = styled.div<Props>`
  width: 100%;
  height: ${({ _height }) => (_height ? _height : "1.5px")};
  margin: ${({ _margin }) => _margin && _margin};
  background-color: ${({ theme, _color }) =>
    _color ? _color : theme.colors.gray_2};
`;
