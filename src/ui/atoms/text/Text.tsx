import { ReactNode, CSSProperties } from "react";
import classNames from "classnames";
import "./Text.css";

export type textColor =
  | "surface"
  | "surface-low"
  | "world"
  | "primary"
  | "on-primary"
  | "secondary"
  | "on-secondary"
  | "danger"
  | "on-danger"
  | "tooltip"
  | "link";

interface IText {
  id?: string;
  className?: string;
  style?: CSSProperties;
  variant?: "h1" | "h2" | "s1" | "s2" | "c1" | "b1" | "b2" | "b3";
  color?: textColor;
  weight?: "light" | "regular" | "medium" | "semi-bold" | "bold";
  type?: undefined | "span" | "label" | "div";
  htmlFor?: string;
  children: ReactNode;
}

export function Text({
  id,
  className,
  style,
  variant = "b1",
  color = "surface",
  weight = "regular",
  type,
  htmlFor,
  children,
}: IText) {
  const textClass = classNames(`Text Text-${variant} Text--${color} Text--${weight}`, className);

  const props = {
    id,
    className: textClass,
    style,
    htmlFor,
  };

  if (type === "span") return <span {...props}>{children}</span>;
  if (type === "label") return <label {...props}>{children}</label>;
  if (type === "div") return <div {...props}>{children}</div>;
  if (variant === "h1") return <h1 {...props}>{children}</h1>;
  if (variant === "h2") return <h2 {...props}>{children}</h2>;
  if (variant === "s1") return <h4 {...props}>{children}</h4>;
  return <p {...props}>{children}</p>;
}
