import Layout from "../components/layout";
import type { AppProps } from "next/app";
import GlobalStyles from "../styles/globalStyles";
import { useDarkMode } from "usehooks-ts";
import { ThemeProvider } from "styled-components";
import { lightTheme, darkTheme } from "../constants/theme";

function MyApp({ Component, pageProps }: AppProps) {
  const { isDarkMode } = useDarkMode();
  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <GlobalStyles />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
}

export default MyApp;
