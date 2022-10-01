import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    colors: {
      primary: string;
      gray_1: "#F5F5F5";
      gray_2: "#EDEDED";
      gray_3: "#EOEOEO";
      gray_4: "#C2C2C2";
      gray_5: "#9E9E9E";
      gray_6: "#757575";
      gray_7: "#616161";
      gray_8: "#424242";
      black: string;
      white: string;
    };
    fontSize: {
      title_mobile: string;
      title_pc: string;
      subtitle1_mobile: string;
      subtitle1_pc: string;
      subtitle2b_mobile: string;
      subtitle2b_pc: string;
      subtitle2r_mobile: string;
      subtitle2r_pc: string;
      subtitle3_mobile: string;
      subtitle3_pc: string;
      body1b_mobile: string;
      body1b_pc: string;
      body1r_mobile: string;
      body1r_pc: string;
      body2b_mobile: string;
      body2b_pc: string;
      body2r_mobile: string;
      body2r_pc: string;
      body3_mobile: string;
      body3_pc: string;
      caption1_mobile: string;
      caption1_pc: string;
      caption2r_mobile: string;
      caption2r_pc: string;
      caption2l_mobile: string;
      caption2l_pc: string;
    };
    fontWeight: {
      extraBold: number;
      bold: number;
      semiBold: number;
      medium: number;
      regular: number;
    };
  }
}
