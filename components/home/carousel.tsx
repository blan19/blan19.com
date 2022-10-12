import Image from "next/image";
import { memo, useCallback, useState } from "react";
import styled, { css } from "styled-components";

import LeftIcon from "../../assets/svg/left.svg";
import RightIcon from "../../assets/svg/right.svg";

interface CarouselProps {
  images: {
    src: string;
    base64: string;
  }[];
}

interface CarouselItemProps {
  image: string;
  base64: string;
}

interface DotProps {
  active: boolean;
}

const Dot = memo(function Dot({ active }: DotProps) {
  return <DotBase $active={active} />;
});

const CarouselItem = memo(function CarouselItem({
  image,
  base64,
}: CarouselItemProps) {
  return (
    <CarouselItemBase>
      <Image
        src={image}
        alt="등산로그"
        width={358}
        height={358}
        layout="fixed"
        placeholder="blur"
        blurDataURL={base64}
        priority
      />
    </CarouselItemBase>
  );
});

const Carousel = ({ images }: CarouselProps) => {
  const [count, setCount] = useState<number>(0);
  const onClick = useCallback((count: number) => {
    setCount((prev) => prev + count);
  }, []);

  return (
    <CarouselBase>
      <CarouselOutline>
        <ArrowButton disabled={count === 0} onClick={() => onClick(-1)}>
          <LeftIcon />
        </ArrowButton>
        <ArrowButton
          $right
          disabled={count === images.length - 1}
          onClick={() => onClick(1)}
        >
          <RightIcon />
        </ArrowButton>
        <ImagesOutline count={count}>
          {images.map((image, idx) => (
            <CarouselItem
              key={image.src + idx}
              image={image.src}
              base64={image.base64}
            />
          ))}
        </ImagesOutline>
      </CarouselOutline>
      <DotOutline>
        {images.map((_, idx) => (
          <Dot active={count === idx} key={idx} />
        ))}
      </DotOutline>
    </CarouselBase>
  );
};

export default Carousel;

const CarouselBase = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CarouselItemBase = styled.div`
  width: 22.375rem;
  position: relative;
  img {
    border-radius: 0.625rem 0.625rem 0 0;
  }
`;

const DotBase = styled.div<{ $active: boolean }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.gray_1 : theme.colors.gray_2};
`;

const ArrowButton = styled.button<{ $right?: boolean }>`
  outline: none;
  border: none;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 1.875rem;
  height: 1.875rem;
  z-index: 999;
  top: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.8;
  cursor: pointer;
  background-color: ${({ theme }) => theme.colors.white};
  &:disabled {
    display: none;
  }
  ${({ $right }) =>
    $right
      ? css`
          right: -0.75rem;
        `
      : css`
          left: 1.094rem;
        `}
`;

const CarouselOutline = styled.div`
  width: 22.375rem;
  position: relative;
  display: flex;
  overflow-x: hidden;
`;

const ImagesOutline = styled.div<{ count: number }>`
  display: flex;
  transition: margin 0.3s ease;
  margin-left: ${({ count }) => `-${count}00%`};
`;

const DotOutline = styled.div`
  margin-top: 0.688rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
`;
