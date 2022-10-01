import type { ReactNode } from "react";

interface CSSElement {
  children?: ReactNode;
  _justifyContent?:
    | "space-around"
    | "space-between"
    | "space-evenly"
    | "flex-end"
    | "flex-start"
    | "first baseline"
    | "center";
  _alignItems?:
    | "normal"
    | "stretch"
    | "center"
    | "start"
    | "end"
    | "flex-start"
    | "flex-end";
  _gap?: string;
  _width?: string;
  _height?: string;
}

export type { CSSElement };
