import styled from "styled-components";

const Information = () => {
  return (
    <Base>
      <h1>내정보</h1>
    </Base>
  );
};

export default Information;

const Base = styled.div`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.bg};
`;
