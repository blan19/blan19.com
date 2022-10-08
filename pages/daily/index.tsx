import styled from "styled-components";
import Divider from "../../components/divider";
import Intro from "../../components/intro";
import { getContentsMeta } from "../../utils/markdown";
import type { GetStaticProps, InferGetStaticPropsType } from "next";

const Daily = ({}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <Base>
      <Intro
        icon="🧑‍🎨"
        title="Junseo Park"
        desc="하나씩 내 일상으로 칠해가는 곳"
      />
      <Divider _height="0.5px" _margin="2rem 0" />
    </Base>
  );
};

export default Daily;

export const getStaticProps: GetStaticProps = async () => {
  const meta = await getContentsMeta("./contents/posts");

  return {
    props: {
      meta,
    },
  };
};

const Base = styled.div`
  padding: 0 2rem;
`;
