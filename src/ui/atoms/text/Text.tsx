import React from "react";
import classNames from "classnames";
import "./Text.css";

interface IText {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: "h2" | "s1" | "b1" | "b2" | "b3";
  weight?: "light" | "regular" | "medium" | "semi-bold" | "bold";
  type?: undefined | "span" | "label" | "div";
  htmlFor?: string;
  children: React.ReactNode;
}

export function Text({ id, className, style, variant = "b1", weight = "regular", type, htmlFor, children }: IText) {
  const textClass = classNames(`Text Text-${variant} Text--${weight}`, className);

  const props = {
    id,
    className: textClass,
    style,
    htmlFor,
  };

  if (type === "span") return <span {...props}>{children}</span>;
  if (type === "label") return <label {...props}>{children}</label>;
  if (type === "div") return <div {...props}>{children}</div>;
  if (variant === "h2") return <h2 {...props}>{children}</h2>;
  if (variant === "s1") return <h4 {...props}>{children}</h4>;
  return <p {...props}>{children}</p>;
}
