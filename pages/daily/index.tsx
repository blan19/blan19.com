import styled from "styled-components";
import Divider from "../../components/divider";
import Intro from "../../components/intro";

const Daily = () => {
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

const Base = styled.div`
  padding: 0 2rem;
`;
