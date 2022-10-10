import styled, { css } from "styled-components";
import DEVICE_LIST from "../../constants/device";
import { lightTheme } from "../../constants/theme";
import { applyMediaQuery } from "../../styles/mediaQuery";
import Typography from "../typography";

const responsiveTitleFont = {
  mobile: lightTheme.fontSize.subtitle1_mobile,
  tablet: lightTheme.fontSize.subtitle1_mobile,
  wideTablet: lightTheme.fontSize.subtitle1_pc,
  desktop: lightTheme.fontSize.subtitle1_pc,
  wideDesktop: lightTheme.fontSize.subtitle1_pc,
};

interface Props {
  title: string;
}

const Title = ({ title }: Props) => {
  return (
    <Base>
      <Typography as="h2" css={responsiveTitleCss}>
        {title}
      </Typography>
    </Base>
  );
};

export default Title;

const Base = styled.div`
  display: inline-block;
  padding-bottom: 0.625rem;
  border-bottom: 1.35px solid ${({ theme }) => theme.colors.gray_1};
`;

const responsiveTitleCss = css`
  color: ${({ theme }) => theme.colors.font};
  font-weight: bold;
  ${DEVICE_LIST.map(
    (device) => `${applyMediaQuery(device)} {
    font-size: ${responsiveTitleFont[device]}
  }`
  ).join("")}
`;
