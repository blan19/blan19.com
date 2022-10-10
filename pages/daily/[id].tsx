import styled from "styled-components";
import Content from "../../components/detail/contents";
import DetailInformation from "../../components/detail/information";
import DEVICE_LIST from "../../constants/device";
import { applyMediaQuery } from "../../styles/mediaQuery";
import { applyReponsiveWidth } from "../../styles/responsive";
import { getContent, getContentsPaths } from "../../utils/markdown";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next/types";

const responsivePadding = {
  mobile: "0 1rem",
  tablet: "0 1rem",
  wideTablet: "0",
  desktop: "0",
  wideDesktop: "0",
};

const DailyDetail = ({
  daily,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <Base>
      <DetailInformation
        title={daily.title}
        creater={daily.creater}
        date={daily.date}
        categories={daily.categories}
      />
      <Content markdown={daily.markdown} />
    </Base>
  );
};

export default DailyDetail;

export const getStaticPaths: GetStaticPaths = () => {
  const paths = getContentsPaths("./contents/daily");
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const daily = await getContent("./contents/daily", params?.id);
  return {
    props: {
      daily,
    },
  };
};

const Base = styled.article`
  margin: 0 auto;
  ${applyReponsiveWidth}
  ${DEVICE_LIST.map(
    (device) => `${applyMediaQuery(device)} {
    padding: ${responsivePadding[device]};
  }`
  )}
`;
