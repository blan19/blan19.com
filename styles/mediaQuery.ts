export type Device =
  | "mobile"
  | "tablet"
  | "wideTablet"
  | "desktop"
  | "wideDesktop";
type DeviceQuery = {
  [key in Device]: string;
};

export const deviceQuery: DeviceQuery = {
  mobile: "(max-width: 599px)",
  tablet: "(min-width: 600px) and (max-width: 799px)",
  wideTablet: "(min-width: 800px) and (max-width: 999px)",
  desktop: "(min-width: 1000px) and (max-width: 1439px)",
  wideDesktop: "(min-width: 1440px)",
};

export const applyMediaQuery = (...deviceList: Device[]) =>
  "@media screen and " +
  deviceList.map((device) => deviceQuery[device]).join(",");
