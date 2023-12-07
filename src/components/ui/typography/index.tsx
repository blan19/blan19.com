import theme from "@/styles/theme";
import { forwardRef } from "react";
import type { AllHTMLAttributes, CSSProperties, ReactNode, Ref } from "react";

type FontSize = (typeof theme.fontSize)[number];

type FontWeight = (typeof theme.fontWeight)[number];

type FontColor = (typeof theme.color)[number];

type FontAlign = "left" | "center" | "right" | "justify" | "start" | "end";

export interface BaseProps {
  children?: ReactNode;
  className?: string;
  fontSize?: FontSize;
  fontWeight?: FontWeight;
  color?: FontColor;
  display?: CSSProperties["display"];
  textAlign?: FontAlign;
  space?: boolean;
}

type TypographyProps<Element extends keyof JSX.IntrinsicElements = "span"> =
  BaseProps & {
    as?: Element;
  } & Omit<AllHTMLAttributes<Element>, "as">;

const Typography = forwardRef(function Typography<
  Element extends keyof JSX.IntrinsicElements = "span"
>(props: TypographyProps<Element>, ref: Ref<HTMLElement>) {
  const {
    as: Component = "span",
    fontWeight = "medium",
    display = "inline-block",
    fontSize = "base",
    textAlign = "center",
    space = false,
    color,
    role,
    children,
  } = props as TypographyProps;

  const fSize = `text-${fontSize}`;
  const fColor = `text-${color}`;
  const fWeight = `font-${fontWeight}`;
  const fAligh = `text-${textAlign}`;
  const fDisplay = display === "none" ? "hidden" : display;
  const fSpace = space ? "whitespace-pre-wrap" : "whitespace-normal";

  return (
    <Component
      ref={ref}
      role={role ?? (Component === "span" ? "text" : undefined)}
      className={`${fDisplay} ${fSize} ${fColor} ${fWeight} ${fAligh} ${fSpace}`}
    >
      {children}
    </Component>
  );
});

export { Typography };
export type { TypographyProps };
