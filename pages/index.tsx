import type { NextPage } from "next";
import Banner from "../components/banner";
import Career from "../components/home/career";
import Information from "../components/home/information";
import Projects from "../components/home/projects";
import Skill from "../components/home/skill";

const Home: NextPage = () => {
  return (
    <>
      <Banner />
      <Information />
      <Skill />
      <Projects />
      <Career />
    </>
  );
};

export default Home;
