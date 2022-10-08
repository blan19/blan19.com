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
`;
