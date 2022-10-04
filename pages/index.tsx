import type { NextPage } from "next";
import Banner from "../components/banner";
import Information from "../components/home/information";

const Home: NextPage = () => {
  return (
    <>
      <Banner />
      <Information />
    </>
  );
};

export default Home;
