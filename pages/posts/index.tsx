import styled from "styled-components";
import Divider from "../../components/divider";
import Intro from "../../components/intro";
import type { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { getContentsMeta } from "../../utils/markdown";

const Posts = ({ meta }: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <Base>
      <Intro icon="🧑‍🎨" title="블로그 포스팅" desc="내 기록들" />
      <Divider _height="0.5px" _margin="2rem 0" />
    </Base>
  );
};

export default Posts;

export const getStaticProps = async ({}: GetStaticPropsContext) => {
  const meta = await getContentsMeta("./contents/projects");

  return {
    props: {
      meta,
    },
  };
};

const Base = styled.div`
  padding: 0 2rem;
`;
