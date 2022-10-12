import { Dispatch, memo, SetStateAction } from "react";
import styled from "styled-components";

interface Props {
  page: number;
  length: number;
  onClick: Dispatch<SetStateAction<number>>;
}

const Pagination = memo(function Pagination({ page, length, onClick }: Props) {
  return (
    <PaginationBase>
      {Array.from({ length }).map((_, idx) => (
        <PaginationButton
          key={idx + 1}
          onClick={() => onClick(idx)}
          $active={idx === page}
          disabled={idx === page}
        >
          {idx + 1}
        </PaginationButton>
      ))}
    </PaginationBase>
  );
});

export default Pagination;

const PaginationBase = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const PaginationButton = styled.button<{ $active: boolean }>`
  outline: none;
  border: none;
  background: none;
  cursor: ${({ $active }) => ($active ? "not-allowed" : "pointer")};

  padding: 0.15rem 0.35rem;
  background-color: ${({ theme, $active }) =>
    $active ? theme.colors.gray_1 : theme.colors.gray_3};
  border-radius: 3px;
`;
