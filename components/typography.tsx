import React, { PropsWithChildren } from "react";
import styled, {
  css,
  DefaultTheme,
  FlattenInterpolation,
  ThemeProps,
} from "styled-components";
import { useDarkMode } from "usehooks-ts";
import type { FlattenSimpleInterpolation } from "styled-components";

import { lightTheme, darkTheme } from "../constants/theme";

const FONT_WEIGHT = {
  extraBold: 800,
  bold: 700,
  semiBold: 600,
  medium: 500,
  regular: 400,
} as const;

type FontSize = keyof typeof lightTheme.fontSize;

type FontColor = keyof typeof lightTheme.colors;

type FontWeight = keyof typeof FONT_WEIGHT;

interface TypographyProps extends PropsWithChildren {
  className?: string;
  size?: FontSize;
  weight?: FontWeight;
  color?: FontColor;
  lineHeight?: string;
  as?: React.ElementType;
  css?:
    | FlattenSimpleInterpolation
    | FlattenInterpolation<ThemeProps<DefaultTheme>>;
}

interface StyledTypographyProps extends TypographyProps {
  $isDarkMode: boolean;
}

const Typography = ({
  className,
  as = "p",
  color = "black",
  lineHeight = "1.563rem",
  ...props
}: TypographyProps): React.ReactElement => {
  const { isDarkMode } = useDarkMode();
  return (
    <BaseTypography $isDarkMode={isDarkMode} as={as} color={color} {...props}>
      {props.children}
    </BaseTypography>
  );
};
export default Typography;

const BaseTypography = styled.p<StyledTypographyProps>`
  ${(props) => css`
    font-size: ${props.size !== undefined
      ? `${
          typeof props.size === "string"
            ? props.$isDarkMode
              ? darkTheme.fontSize[props.size]
              : lightTheme.fontSize[props.size]
            : props.size
        }`
      : ""};
    font-weight: ${props.weight && FONT_WEIGHT[props.weight]};
    color: ${props.$isDarkMode
      ? darkTheme.colors[props.color || "black"]
      : lightTheme.colors[props.color || "black"]};
    white-space: pre-wrap;
    line-height: ${props.lineHeight || "150%"};
  `}
  ${(props) => props.css}
`;
