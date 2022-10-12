import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Banner from "../components/banner";
import Career from "../components/home/career";
import Information from "../components/home/information";
import Projects from "../components/home/projects";
import Skill from "../components/home/skill";
import { getProjects } from "../utils/markdown";

const Home: NextPage = ({
  projects,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <>
      <Banner />
      <Information />
      <Skill />
      <Projects projects={projects} />
      <Career />
    </>
  );
};

export default Home;

export const getStaticProps: GetStaticProps = async () => {
  const projects = await Promise.all(await getProjects("./contents/projects"));

  return {
    props: {
      projects,
    },
  };
};
