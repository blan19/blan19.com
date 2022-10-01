import React, { PropsWithChildren } from 'react';
import styled, { css } from 'styled-components';

import contants from '~/constants/theme';

const FONT_WEIGHT = {
  extraBold: 800,
  bold: 700,
  semiBold: 600,
  medium: 500,
  regular: 400,
} as const;

type FontSize = keyof typeof contants.fontSize;

type FontColor = keyof typeof contants.colors;

type FontWeight = keyof typeof FONT_WEIGHT;

interface TypographyProps extends PropsWithChildren {
  className?: string;
  size?: FontSize;
  weight?: FontWeight;
  color?: FontColor;
  lineHeight?: string;
  as?: React.ElementType;
}

const Typography = ({
  className,
  as = 'p',
  color = 'black',
  lineHeight = '1.563rem',
  ...props
}: TypographyProps): React.ReactElement => {
  return (
    <BaseTypography as={as} color={color} {...props}>
      {props.children}
    </BaseTypography>
  );
};
export default Typography;

const BaseTypography = styled.p<TypographyProps>`
  ${(props) => css`
    font-size: ${props.size !== undefined
      ? `${
          typeof props.size === 'string'
            ? contants.fontSize[props.size]
            : props.size
        }`
      : ''};
    font-weight: ${props.weight && FONT_WEIGHT[props.weight]};
    color: ${contants.colors[props.color || 'black']};
    white-space: pre-wrap;
    line-height: ${props.lineHeight};
  `}
`;
