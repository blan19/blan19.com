import styled from "styled-components";
import Divider from "../../components/divider";
import Intro from "../../components/intro";
import { getContentsMeta } from "../../utils/markdown";
import { PostCard } from "../../components/card";
import { NextSeo } from "next-seo";
import type { InferGetStaticPropsType } from "next";

const Daily = ({ meta }: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <>
      <NextSeo title="blan19 블로그 포스팅" description="내가 일상 기록들" />
      <Base>
        <Intro
          icon="🧑‍🎨"
          title="Junseo Park"
          desc="하나씩 내 일상으로 칠해가는 곳"
        />
        <Divider _height="0.5px" _margin="2rem 0" />
        {meta.map((m) => (
          <PostCard key={m.title} {...m} />
        ))}
      </Base>
    </>
  );
};

export default Daily;

export const getStaticProps = async () => {
  const meta = await getContentsMeta("./contents/daily").reverse();

  return {
    props: {
      meta,
    },
  };
};

const Base = styled.div`
  padding: 0 2rem;
`;
