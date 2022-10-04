import Image from "next/image";
import styled from "styled-components";
import src from "../public/images/banner.JPG";

const Banner = () => {
  return (
    <Base>
      <Image src={src} alt="배너" layout="fill" objectFit="cover" />
    </Base>
  );
};

export default Banner;

const Base = styled.section`
  width: 100%;
  height: 23.438rem;
  background-color: rgba(0, 0, 0, 0.5);
  position: relative;
  img {
    z-index: -1;
  }
`;
