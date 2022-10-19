import styled from "styled-components";
import Title from "./title";

import Lottie from "lottie-react";
import clsx from "clsx";

import developer from "../../assets/json/developer.json";

import CPlusPlusLogo from "../../assets/svg/cplusplus.svg";
import JavascriptLogo from "../../assets/svg/javascript.svg";
import TypescriptLogo from "../../assets/svg/typescript.svg";
import ReactLogo from "../../assets/svg/react.svg";
import NextLogo from "../../assets/svg/nextdotjs.svg";
import RemixLogo from "../../assets/svg/remix.svg";
import NodeLogo from "../../assets/svg/nodedotjs.svg";
import NestLogo from "../../assets/svg/nestjs.svg";
import MySQLLogo from "../../assets/svg/mysql.svg";
import PostgreSQLLogo from "../../assets/svg/postgresql.svg";
import AWSLogo from "../../assets/svg/amazonaws.svg";
import VercelLogo from "../../assets/svg/vercel.svg";
import NetlifyLogo from "../../assets/svg/netlify.svg";
import HerokuLogo from "../../assets/svg/heroku.svg";
import Typography from "../typography";
import { applyMediaQuery } from "../../styles/mediaQuery";

interface Skill {
  name: string;
  icon: JSX.Element;
  color: string;
}

interface SkillList {
  title: string;
  skill: Skill[];
}

const skillList: SkillList[] = [
  {
    title: "Language",
    skill: [
      { name: "C++", icon: <CPlusPlusLogo />, color: "#00599C" },
      { name: "Javascript", icon: <JavascriptLogo />, color: "#F7DF1E" },
      { name: "Typescript", icon: <TypescriptLogo />, color: "#3178C6" },
    ],
  },
  {
    title: "Front",
    skill: [
      { name: "React", icon: <ReactLogo />, color: "#61DAFB" },
      { name: "Next", icon: <NextLogo />, color: "#000000" },
      { name: "Remix", icon: <RemixLogo />, color: "#000000" },
      { name: "React-Native", icon: <ReactLogo />, color: "#61DAFB" },
    ],
  },
  {
    title: "Back",
    skill: [
      { name: "Node.js", icon: <NodeLogo />, color: "#339933" },
      { name: "Nest.js", icon: <NestLogo />, color: "#E0234E" },
    ],
  },
  {
    title: "DB",
    skill: [
      { name: "MySQL", icon: <MySQLLogo />, color: "#4479A1" },
      { name: "PostgreSQL", icon: <PostgreSQLLogo />, color: "#4169E1" },
    ],
  },
  {
    title: "Deployment",
    skill: [
      { name: "AWS", icon: <AWSLogo />, color: "#232F3E" },
      { name: "Vercel", icon: <VercelLogo />, color: "#000000" },
      { name: "Netlify", icon: <NetlifyLogo />, color: "#00C7B7" },
      { name: "Heroku", icon: <HerokuLogo />, color: "#430098" },
    ],
  },
];

const Skill = () => {
  return (
    <Base>
      <Title title="Skills" />
      <SkillWrapper>
        <SkillOutline>
          {skillList.map((skill) => (
            <SkillList key={skill.title} {...skill} />
          ))}
        </SkillOutline>
        <Lottie className={clsx("skill-lottie")} animationData={developer} />
      </SkillWrapper>
    </Base>
  );
};

const SkillList = ({ title, skill }: SkillList) => {
  return (
    <SkillListBase>
      <Typography as="h3" size="subtitle3_pc" weight="bold" color="font">
        # {title}
      </Typography>
      <SkillListOutline>
        {skill.map((l) => (
          <SkillLogo key={l.name} {...l} />
        ))}
      </SkillListOutline>
    </SkillListBase>
  );
};

const SkillLogo = ({ icon, name, color }: Skill) => {
  return (
    <SkillLogoBase _color={color}>
      {icon}
      <Typography size="subtitle3_mobile" color="white">
        {name}
      </Typography>
    </SkillLogoBase>
  );
};

export default Skill;

const Base = styled.div`
  width: 100%;
  padding: 2.75rem 0;
  background-color: ${({ theme }) => theme.colors.gray_3};
  /* background-color: #f1f3f5; */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
`;

const SkillWrapper = styled.div`
  display: flex;
  .skill-lottie {
    display: none;
  }
  ${applyMediaQuery("desktop", "wideDesktop")} {
    .skill-lottie {
      display: block;
    }
  }
`;

const SkillOutline = styled.ul`
  width: 100%;
  gap: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: center;
  ${applyMediaQuery("desktop", "wideDesktop")} {
    align-items: flex-start;
    text-align: initial;
  }
`;

const SkillListBase = styled.li`
  display: flex;
  flex-direction: column;
`;

const SkillListOutline = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const SkillLogoBase = styled.div<{ _color: string }>`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
  background-color: ${({ _color }) => _color};
  padding: 0.4rem;
  border-radius: 2px;
  transition: all ease-in-out 0.3s;
  svg {
    fill: #fff;
    width: 15px;
    height: 15px;
  }
  &:hover {
    transform: scale(1.1, 1.1);
  }
`;
