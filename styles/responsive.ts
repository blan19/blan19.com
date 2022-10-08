import { css } from "styled-components";

import { applyMediaQuery, Device } from "./mediaQuery";

const DEVICE_LIST: Device[] = [
  "mobile",
  "tablet",
  "wideTablet",
  "desktop",
  "wideDesktop",
];

const availableWidths = {
  mobile: "100%",
  tablet: "100%",
  wideTablet: "800px",
  desktop: "800px",
  wideDesktop: "800px",
};

export const applyReponsiveWidth = css`
  ${DEVICE_LIST.map(
    (deviceInfo) => `
    ${applyMediaQuery(deviceInfo)} {
      width: ${availableWidths[deviceInfo]};
    }
  `
  ).join("")}
`;
