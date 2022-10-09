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

const responsivePadding = {
  mobile: "0 1rem",
  tablet: "0 1rem",
  wideTablet: "100%",
  desktop: "100%",
  wideDesktop: "100%",
};

const PostsDetail = ({
  post,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <Base>
      <DetailInformation
        title={post.title}
        creater={post.creater}
        date={post.date}
        categories={post.categories}
      />
      <Content markdown={post.markdown} />
    </Base>
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
  const post = await getContent("./contents/posts", params?.id);
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
