import styled from "styled-components";
import Content from "../../components/detail/contents";
import DetailInformation from "../../components/detail/information";
import DEVICE_LIST from "../../constants/device";
import { applyMediaQuery } from "../../styles/mediaQuery";
import { applyReponsiveWidth } from "../../styles/responsive";
import { getContent, getContentsPaths } from "../../utils/markdown";
import { NextSeo } from "next-seo";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next/types";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const Comment = dynamic(() => import("../../components/detail/comment"), {
  suspense: true,
});

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
    <>
      <NextSeo title={daily.title} description={daily.summary} />
      <Base>
        <DetailInformation
          title={daily.title}
          creater={daily.creater}
          date={daily.date}
          categories={daily.categories}
        />
        <Content markdown={daily.markdown} />
        <Suspense fallback={<div>loading..</div>}>
          <Comment />
        </Suspense>
      </Base>
    </>
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
  const daily = await getContent("./contents/daily", params?.id as string);
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
