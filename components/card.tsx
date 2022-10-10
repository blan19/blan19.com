import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";
import { PostMdxMeta } from "../types/mdx";
import Typography from "./typography";

const Tags = ({ tags }: { tags: string[] }) => {
  return (
    <TagsBase>
      {tags.map((tag, idx) => (
        <Tag key={`${Math.random() * 5 + idx}-${tag}`}>
          <Typography
            as="span"
            size="caption2r_mobile"
            weight="regular"
            color="gray_1"
          >
            {`#${tag}`}
          </Typography>
        </Tag>
      ))}
    </TagsBase>
  );
};

export const PostCard = ({
  title,
  thumbnail,
  date,
  summary,
  creater,
  categories,
  id,
  base64,
  src,
}: PostMdxMeta) => {
  const { pathname } = useRouter();

  return (
    <PostCardLink href={`${pathname}/${id}`}>
      <PostCardOutline>
        <CardImageOutline>
          <PostsCardImage
            src={src}
            alt="thumbnail"
            width={150}
            height={150}
            objectFit="cover"
            layout="fixed"
            placeholder="blur"
            blurDataURL={base64}
          />
        </CardImageOutline>
        <PostCardMeta>
          <CardInfo>
            <Typography
              as="span"
              size="body3_mobile"
              weight="regular"
              color="gray_1"
            >
              {date}
            </Typography>
            <Typography
              as="span"
              size="body3_mobile"
              weight="regular"
              color="gray_1"
            >
              {`by `}
              <Typography as="b" color="font">
                {creater}
              </Typography>
            </Typography>
          </CardInfo>
          <Typography
            as="h2"
            size="subtitle3_mobile"
            weight="semiBold"
            color="font"
          >
            {title}
          </Typography>
          <Typography
            as="p"
            size="body3_mobile"
            weight="regular"
            color="gray_1"
          >
            {summary}
          </Typography>
          <Tags tags={categories} />
        </PostCardMeta>
      </PostCardOutline>
    </PostCardLink>
  );
};

const PostCardLink = styled(Link)`
  width: 100%;
  box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.sub};
`;

const PostCardOutline = styled.div`
  display: flex;
  position: relative;
  cursor: pointer;
  gap: 1rem;
`;

const CardImageOutline = styled.div`
  width: 150px;
  height: 150px;
`;

const PostsCardImage = styled(Image)`
  border-radius: 5px;
`;

const PostCardMeta = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  word-break: break-all;
`;

const CardInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TagsBase = styled.ul`
  display: flex;
  gap: 5px;
`;

const Tag = styled.li``;
