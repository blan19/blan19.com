import Image from "next/image";
import styled from "styled-components";
import profile from "../../public/images/memoji-min.png";
import Typography from "../typography";
import Divider from "../divider";
import Category from "../posts/category";
import CalendarIcon from "../../assets/svg/calendar.svg";
import CommentIcon from "../../assets/svg/comment.svg";

interface Props {
  title: string;
  creater: string;
  date: string;
  categories: string[];
}

const InforProfileImage = () => {
  return (
    <InforProfileImageBase>
      <Image src={profile} alt="프로필" layout="fill" />
    </InforProfileImageBase>
  );
};

const DetailInformation = ({ creater, date, title, categories }: Props) => {
  return (
    <InforBase>
      {/* <Category /> */}
      <Typography as="h1" size="title_pc" weight="bold" color="font">
        {title}
      </Typography>
      <InforOutline>
        <InforList>
          <InforWrapper>
            <InforLeft>
              <CalendarIcon />
              <Typography as="span" size="caption1_mobile" color="gray_1">
                Date
              </Typography>
            </InforLeft>
            <InforRight>
              <Typography as="span" size="caption1_mobile" color="font">
                {date}
              </Typography>
            </InforRight>
          </InforWrapper>
        </InforList>
        <InforList>
          <InforWrapper>
            <InforLeft>
              <CommentIcon />
              <Typography as="span" size="caption1_mobile" color="gray_1">
                Created by
              </Typography>
            </InforLeft>
            <InforRight>
              <InforProfileImage />
              <Typography as="span" size="caption1_mobile" color="font">
                {creater}
              </Typography>
            </InforRight>
          </InforWrapper>
        </InforList>
      </InforOutline>
      <Divider _height="1px" _margin="3rem 0" />
    </InforBase>
  );
};

export default DetailInformation;

const InforBase = styled.div`
  margin-top: 5rem;
`;

const InforOutline = styled.ul`
  list-style: none;
  margin-top: 2rem;
`;

const InforList = styled.li`
  margin-top: 2rem;
`;

const InforWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const InforLeft = styled.div`
  width: 20rem;
  display: flex;
  align-items: center;
  span {
    margin-left: 1rem;
  }
  fill: ${({ theme }) => theme.colors.gray_1};
`;

const InforRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const InforProfileImageBase = styled.div`
  position: relative;
  width: 2rem;
  height: 2rem;
  padding: 1rem;
  border-radius: 1.5rem;
  background: ${(props) => props.theme.colors.gray_2};
`;
