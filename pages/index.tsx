import type { NextPage } from "next";
import Banner from "../components/banner";
import Information from "../components/home/information";
import Skill from "../components/home/skill";

const Home: NextPage = () => {
  return (
    <>
      <Banner />
      <Information />
      <Skill />
    </>
  );
};

export default Home;
