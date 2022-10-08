import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import { PostMdxMeta } from "../types/mdx";

export const PostCard = ({
  title,
  thumbnail,
  date,
  summary,
  creater,
  categories,
}: PostMdxMeta) => {
  return (
    <PostCardLink href="">
      <PostCardOutline>
        <PostsCardImage
          src={"/images/" + thumbnail}
          alt="thumbnail"
          width={200}
          height={200}
        />
        <PostCardMeta>
          {/* <div className="posts-item-title">{title}</div> */}
          {/* <div className="posts-item-desc">{summary}</div> */}
          {/* <div className="posts-item-date">{date}</div> */}
        </PostCardMeta>
        <div className="posts-item-creater">
          {/* <span>by</span> <b>{creater}</b> */}
        </div>
      </PostCardOutline>
    </PostCardLink>
  );
};

const PostCardLink = styled(Link)`
  box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.sub};
  &:hover {
    transform: translateY(-7px);
    transition: all 0.4s ease-in-out;
    box-shadow: rgba(0, 0, 0, 0.28) 0px 4px 7px;
  }
  .posts-item-creater {
    font-size: small;
    padding: 2rem 0;
    /* border-top: 1px solid ${({ theme }) => theme.colors.bg}; */
    span {
      padding-left: 15px;
    }
    b {
    }
  }
`;

const PostCardOutline = styled.div``;

const PostsCardImage = styled(Image)`
  width: 100%;
  height: 200px;
  border-radius: 10px 10px 0 0;
`;

const PostCardMeta = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 15px;
  margin-top: 2.5rem;
  .posts-item-title {
    font-weight: bold;
    font-size: large;
    color: ${(props) => props.theme.colors.font};
  }
  .posts-item-desc {
    font-size: small;
    color: ${(props) => props.theme.colors.font};
    margin: 0.5rem 0;
  }
  .posts-item-date {
    color: ${(props) => props.theme.colors.font};
    font-size: small;
    margin-top: 5rem;
    margin-bottom: 2rem;
  }
`;
