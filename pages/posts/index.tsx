import styled from "styled-components";
import Divider from "../../components/divider";
import Intro from "../../components/intro";
import useSelectedCateogry from "../../hooks/useSelectedCategory";
import Category from "../../components/posts/category";
import { getContentsMeta } from "../../utils/markdown";
import { useMemo } from "react";
import { getCategry } from "../../utils/misc";
import { PostCard } from "../../components/card";
import type { GetStaticPropsContext, InferGetStaticPropsType } from "next";

const Posts = ({
  meta,
  category,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const { selectedCategry, onPushQuery } = useSelectedCateogry();
  const posts = useMemo(
    () =>
      meta.filter((m) =>
        selectedCategry !== "All" ? m.categories.includes(selectedCategry) : m
      ),
    [meta, selectedCategry]
  );

  return (
    <Base>
      <Intro icon="🧑‍💻" title="블로그 포스팅" desc="내 기록들" />
      <Divider _height="0.5px" _margin="2rem 0" />
      <Category
        category={category}
        selectedCategory={selectedCategry}
        onPushQuery={onPushQuery}
      />
      <CardOutline>
        {posts.map((post) => (
          <PostCard key={post.title} {...post} />
        ))}
      </CardOutline>
    </Base>
  );
};

export default Posts;

export const getStaticProps = async ({}: GetStaticPropsContext) => {
  const meta = await getContentsMeta("./contents/posts");
  const category = getCategry(meta);

  return {
    props: {
      meta,
      category,
    },
  };
};

const Base = styled.div`
  padding: 0 2rem;
`;

const CardOutline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin: 2rem 0;
`;
