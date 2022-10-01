import { createGlobalStyle } from "styled-components";
import { normalize } from "styled-normalize";

const GlobalStyles = createGlobalStyle`
  ${normalize}

  @font-face {
    font-family: 'Pretendard';
    src: url('/fonts/Pretendard-Regular.woff2')format('woff2'), url("/fonts/Pretendard-Regular.woff")format("woff");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'Pretendard';
    src: url('/fonts/Pretendard-Medium.woff2')format('woff2'), url("/fonts/Pretendard-Medium.woff")format("woff");
    font-weight: 500;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/fonts/Pretendard-SemiBold.woff2')format('woff2'), url("/fonts/Pretendard-SemiBold.woff")format("woff");
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/fonts/Pretendard-Bold.woff2')format('woff2'), url("/fonts/Pretendard-Bold.woff")format("woff");
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/fonts/Pretendard-ExtraBold.woff2')format('woff2'), url("/fonts/Pretendard-ExtraBold.woff")format("woff");
    font-weight: 800;
    font-style: normal;
    font-display: swap;
  }

  html, body {
    font-family: 'Pretendard';
  }

  * {
    outline: none;
    box-sizing: border-box;
  }
  
  a {
    color: inherit;
    text-decoration: none;
  }
`;

export default GlobalStyles;
