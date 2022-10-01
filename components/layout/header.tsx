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

const Header: FunctionComponent = ({}) => {
  const router = useRouter();
  return (
    <>
      <HeaderContainer>
        <HeaderWrapper>
          <div className="header-user">
            <Image src={src} alt="profile" />
            <span onClick={() => router.push("/")}>blan19</span>
          </div>
          <div>
            <ul>
              <li>
                <div className="header-box">
                  <ShareIcon />
                </div>
              </li>
              <li>
                <label>
                  <Switch
                    checked={false}
                    onChange={() => console.log("toggle")}
                    width={50}
                    height={25}
                    handleDiameter={18}
                    offColor="#D2D2D2"
                    onColor="#F1C945"
                    aria-label="dark-mode"
                    uncheckedIcon={
                      <HeaderToggleIconContainer>
                        <SunIcon />
                      </HeaderToggleIconContainer>
                    }
                    checkedIcon={
                      <HeaderToggleIconContainer>
                        <MoonIcon />
                      </HeaderToggleIconContainer>
                    }
                  />
                </label>
              </li>
            </ul>
          </div>
        </HeaderWrapper>
        <Progress />
      </HeaderContainer>
    </>
  );
};

export default Header;

const HeaderContainer = styled.header`
  width: 100%;
  height: 55px;
  position: fixed;
  z-index: 999;

  .scroll-progress {
    width: 100%;
    height: 2px;
    position: fixed;

    .scroll-progress-progress {
      height: 100%;
      background-color: #8c5be9;
    }
  }
`;
const HeaderWrapper = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 1rem;

  .header-user {
    img {
      width: 50px;
      height: 50px;
    }
    span {
      cursor: pointer;
      font-weight: bold;
      font-size: 17px;
      padding-left: 5px;
    }
  }

  ul {
    li {
      padding-left: 5px;
      .header-box {
        border-radius: 6px;
        padding: 7.5px;
        a {
        }
        &:hover {
        }
        svg {
          font-size: 17px;
          cursor: pointer;
        }
      }
    }
  }
`;
const HeaderToggleIconContainer = styled.div`
  width: 100%;
  height: 100%;
  svg {
    font-size: 17px;
  }
`;
