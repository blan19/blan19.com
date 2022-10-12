import styled from "styled-components";
import UserIcon from "../../assets/svg/user.svg";
import CallIcon from "../../assets/svg/call.svg";
import LocationIcon from "../../assets/svg/location.svg";
import HatIcon from "../../assets/svg/mortarboard.svg";
import Title from "./title";
import Typography from "../typography";
import DEVICE_LIST from "../../constants/device";
import { applyMediaQuery } from "../../styles/mediaQuery";

const responseInforGrid = {
  mobile: "1fr",
  tablet: "1fr 1fr",
  wideTablet: "1fr 1fr",
  desktop: "1fr 1fr",
  wideDesktop: "1fr 1fr",
};

interface InforList {
  title: string;
  desc: string;
  icon: JSX.Element;
}

const infoList: InforList[] = [
  {
    title: "이름",
    desc: "박준서",
    icon: <UserIcon />,
  },
  {
    title: "연락처",
    desc: "010-6257-9881",
    icon: <CallIcon />,
  },
  {
    title: "내가 사는곳",
    desc: "서울특별시 이태원구",
    icon: <LocationIcon />,
  },
  {
    title: "학력",
    desc: "숭실대학교\n(글로벌미디어학과)",
    icon: <HatIcon />,
  },
];

const Information = () => {
  return (
    <Base>
      <Title title="About" />
      <InformationItemOutline>
        {infoList.map((i) => (
          <InformationItem key={i.title} {...i} />
        ))}
      </InformationItemOutline>
    </Base>
  );
};

const InformationItem = ({ title, desc, icon }: InforList) => {
  return (
    <InformationItemBase>
      {icon}
      <InformationItemDesc>
        <Typography as="h3" weight="semiBold" size="subtitle3_pc" color="font">
          {title}
        </Typography>
        <Typography as="p" size="body2b_mobile" weight="regular" color="font">
          {desc}
        </Typography>
      </InformationItemDesc>
    </InformationItemBase>
  );
};

export default Information;

const Base = styled.div`
  width: 100%;
  padding: 2.75rem 0;
  background-color: ${({ theme }) => theme.colors.bg};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
`;

const InformationItemOutline = styled.ul`
  display: grid;
  row-gap: 3rem;
  column-gap: 7.5rem;
  margin-top: 2rem;
  ${DEVICE_LIST.map(
    (device) => `${applyMediaQuery(device)} {
    grid-template-columns: ${responseInforGrid[device]}
  }`
  ).join("")}
`;

const InformationItemBase = styled.li`
  display: flex;
  gap: 0.75rem;
  fill: ${({ theme }) => theme.colors.font};
`;

const InformationItemDesc = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;
