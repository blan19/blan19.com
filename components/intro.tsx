import styled from "styled-components";
import Typography from "./typography";

interface Props {
  icon: string;
  title: string;
  desc: string;
}

const Intro = (props: Props) => {
  const { icon, title, desc } = props;
  return (
    <Base>
      <Typography as="h2">{icon}</Typography>
      <Typography as="h1" color="font" size="title_pc" weight="medium">
        {title}
      </Typography>
      <Typography as="p" color="gray_1" size="subtitle3_pc" weight="regular">
        {desc}
      </Typography>
    </Base>
  );
};

export default Intro;

const Base = styled.section`
  padding-top: 10rem;
  h1 {
    margin-bottom: 0.5rem;
  }
  h2 {
    font-size: 6.5rem;
    margin-bottom: 2rem;
  }
`;
