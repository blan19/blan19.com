import Image from "next/image";
import styled, { css } from "styled-components";
import DEVICE_LIST from "../constants/device";
import { lightTheme } from "../constants/theme";
import src from "../public/images/banner.JPG";
import { applyMediaQuery } from "../styles/mediaQuery";
import Typography from "./typography";

const responseBannerTitleFonts = {
  mobile: lightTheme.fontSize.title_mobile,
  tablet: lightTheme.fontSize.title_mobile,
  wideTablet: lightTheme.fontSize.title_pc,
  desktop: lightTheme.fontSize.title_pc,
  wideDesktop: lightTheme.fontSize.title_pc,
};

const responseBannerSubTitleFonts = {
  mobile: lightTheme.fontSize.subtitle3_mobile,
  tablet: lightTheme.fontSize.subtitle3_mobile,
  wideTablet: lightTheme.fontSize.subtitle3_pc,
  desktop: lightTheme.fontSize.subtitle3_pc,
  wideDesktop: lightTheme.fontSize.subtitle3_pc,
};

const Banner = () => {
  return (
    <Base>
      <Background>
        <Typography as="p" css={responsiveBannerTitleCss}>
          Welcome to Blan19 World
        </Typography>
        <BannerDivider />
        <Typography as="p" css={responseBannerSubTitleCss}>
          {`안녕하세요.
배움을 두려워하지 않는
웹프론트엔드 개발자 박준서입니다. `}
        </Typography>
      </Background>
      <Image
        src={src}
        alt="배너"
        layout="fill"
        objectFit="cover"
        priority
        placeholder="blur"
        blurDataURL="/images/banner-blur.jpg"
      />
    </Base>
  );
};

export default Banner;

const Base = styled.section`
  width: 100%;
  height: 23.438rem;
  position: relative;
`;

const Background = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const BannerDivider = styled.div`
  width: 4.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  height: 1.75px;
`;

const responsiveBannerTitleCss = css`
  color: ${({ theme }) => theme.colors.white};
  font-weight: bold;
  ${DEVICE_LIST.map(
    (device) => `${applyMediaQuery(device)} {
    font-size: ${responseBannerTitleFonts[device]}
  }`
  ).join("")}
`;

const responseBannerSubTitleCss = css`
  color: ${({ theme }) => theme.colors.white};
  font-weight: 400;
  line-height: 1.5rem;
  white-space: pre-wrap;
  ${DEVICE_LIST.map(
    (device) => `${applyMediaQuery(device)} {
    font-size: ${responseBannerSubTitleFonts[device]}
  }`
  ).join("")}
`;
