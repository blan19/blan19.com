import React from "react";
import styled from "styled-components";
import Title from "./title";

const Career = () => {
  return (
    <Base>
      <Title title="Career" />
    </Base>
  );
};

export default Career;

const Base = styled.div`
  width: 100%;
  padding: 2.75rem 0;
  background-color: ${({ theme }) => theme.colors.gray_2};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
