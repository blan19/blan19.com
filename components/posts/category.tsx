import { memo } from "react";
import styled from "styled-components";

interface Props {
  category: [string, number][];
  selectedCategory: string;
  onPushQuery: (query: string) => void;
}

const Category = memo(function Category({
  category,
  selectedCategory,
  onPushQuery,
}: Props) {
  return (
    <Base>
      {category.map(([key, value]) => (
        <CategoryOutline
          key={key}
          onClick={() => onPushQuery(`?category=${key}`)}
          className={selectedCategory === key ? "active" : ""}
        >
          <h1>{key}</h1>
          <span>{`(${value})`}</span>
        </CategoryOutline>
      ))}
    </Base>
  );
});

export default Category;

const Base = styled.ul`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  .active {
    opacity: 1;
  }
`;

const CategoryOutline = styled.li`
  background-color: ${({ theme }) => theme.colors.gray_2};
  color: ${({ theme }) => theme.colors.font};
  font-size: ${({ theme }) => theme.fontSize.caption2r_mobile};
  padding: 0.5rem;
  border-radius: 0.625rem;
  display: flex;
  gap: 0.25rem;
  cursor: pointer;
  opacity: 0.4;

  span {
    color: ${({ theme }) => theme.colors.gray_1};
  }
`;
