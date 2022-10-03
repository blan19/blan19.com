import type { NextPage } from "next";
import { useDarkMode } from "usehooks-ts";

const Home: NextPage = () => {
  const { toggle } = useDarkMode();
  return (
    <div>
      <br />
      <br />
      <br />
      <br />
      <button onClick={toggle}>dark</button>
    </div>
  );
};

export default Home;
