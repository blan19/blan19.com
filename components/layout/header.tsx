import styled from "styled-components";
import Switch from "react-switch";
import Image from "next/image";
import { FunctionComponent } from "react";
import { useRouter } from "next/router";
import src from "../../public/images/memoji-min.png";
import ShareIcon from "../../assets/svg/share.svg";
import MoonIcon from "../../assets/svg/moon.svg";
import SunIcon from "../../assets/svg/sun.svg";
import Progress from "../progress";
import Typography from "../typography";
import { useDarkMode } from "usehooks-ts";

const Header: FunctionComponent = ({}) => {
  const router = useRouter();
  const { isDarkMode, toggle } = useDarkMode();
  return (
    <>
      <HeaderContainer>
        <HeaderWrapper>
          <LogoOutline onClick={() => router.push("/")}>
            <Image src={src} alt="profile" />
            <Typography as="span" size="subtitle3_mobile" weight="semiBold">
              blan19
            </Typography>
          </LogoOutline>
          <ItemsOutline>
            <Item>
              <ShareIcon />
            </Item>
            <Item>
              <label>
                <Switch
                  checked={isDarkMode}
                  onChange={toggle}
                  width={50}
                  height={25}
                  handleDiameter={18}
                  offColor="#D2D2D2"
                  onColor="#F1C945"
                  aria-label="dark-mode"
                  uncheckedIcon={
                    <IconOutline>
                      <SunIcon />
                    </IconOutline>
                  }
                  checkedIcon={
                    <IconOutline>
                      <MoonIcon />
                    </IconOutline>
                  }
                />
              </label>
            </Item>
          </ItemsOutline>
        </HeaderWrapper>
        <Progress />
      </HeaderContainer>
    </>
  );
};

export default Header;

const HeaderContainer = styled.header`
  width: 100%;
  position: fixed;
  z-index: 999;
`;

const HeaderWrapper = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 1rem;
`;

const IconOutline = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoOutline = styled.div`
  display: flex;
  align-items: centers;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  span {
    display: flex;
    align-items: center;
    padding-left: 0.5rem;
  }
`;

const ItemsOutline = styled.ul`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Item = styled.li`
  display: flex;
  align-items: center;
`;
