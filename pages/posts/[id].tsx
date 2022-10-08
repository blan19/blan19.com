import { getContent, getContentsPaths } from "../../utils/markdown";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";

const PostsDetail = ({
  post,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <div>
      <h1>detail</h1>
    </div>
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
