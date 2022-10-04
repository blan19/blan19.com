import styled from "styled-components";
import Divider from "../../components/divider";
import Intro from "../../components/intro";

const Posts = () => {
  return (
    <Base>
      <Intro icon="🧑‍🎨" title="블로그 포스팅" desc="내 기록들" />
      <Divider _color="" />
    </Base>
  );
};

export default Posts;

const Base = styled.div`
  padding: 0 2rem;
`;
