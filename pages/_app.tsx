import Layout from "../components/layout";
import GlobalStyles from "../styles/globalStyles";
import seo from "../constants/seo";
import { useDarkMode } from "usehooks-ts";
import { ThemeProvider } from "styled-components";
import { lightTheme, darkTheme } from "../constants/theme";
import { DefaultSeo } from "next-seo";
import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  const { isDarkMode } = useDarkMode();
  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <DefaultSeo {...seo} />
      <GlobalStyles />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
}

export default MyApp;
