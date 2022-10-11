import styled from "styled-components";
import Title from "./title";

const Projects = () => {
  return (
    <Base>
      <Title title="Projects" />
    </Base>
  );
};

export default Projects;

const Base = styled.div`
  width: 100%;
  padding: 2.75rem 0;
  background-color: ${({ theme }) => theme.colors.bg};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
