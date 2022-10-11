import { getContent, getContentsPaths } from "../../utils/markdown";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import DetailInformation from "../../components/detail/information";
import styled from "styled-components";
import { applyReponsiveWidth } from "../../styles/responsive";
import Content from "../../components/detail/contents";
import DEVICE_LIST from "../../constants/device";
import { applyMediaQuery } from "../../styles/mediaQuery";
import dynamic from "next/dynamic";
import { NextSeo } from "next-seo";
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

const PostsDetail = ({
  post,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <>
      <NextSeo title={post.title} description={post.summary} />
      <Base>
        <DetailInformation
          title={post.title}
          creater={post.creater}
          date={post.date}
          categories={post.categories}
        />
        <Content markdown={post.markdown} />
        <Suspense fallback={<div>loading..</div>}>
          <Comment />
        </Suspense>
      </Base>
    </>
  );
};

export default PostsDetail;

export const getStaticPaths: GetStaticPaths = () => {
  const paths = getContentsPaths("./contents/posts");
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = await getContent("./contents/posts", params?.id as string);
  return {
    props: {
      post,
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
