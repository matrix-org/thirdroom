import React from "react";
import classNames from "classnames";
import "./Text.css";

interface IText {
  className?: string;
  style?: React.CSSProperties;
  variant?: "h2" | "s1" | "b1" | "b2" | "b3";
  weight?: "light" | "regular" | "medium" | "semi-bold" | "bold";
  type?: undefined | "span" | "div";
  children: React.ReactNode;
}

export function Text({ className, style, variant = "b1", weight = "regular", type, children }: IText) {
  const textClass = classNames(`Text Text-${variant} Text--${weight}`, className);

  if (type === "span")
    return (
      <span className={textClass} style={style}>
        {children}
      </span>
    );
  if (type === "div")
    return (
      <div className={textClass} style={style}>
        {children}
      </div>
    );
  if (variant === "h2")
    return (
      <h2 className={textClass} style={style}>
        {children}
      </h2>
    );
  if (variant === "s1")
    return (
      <h4 className={textClass} style={style}>
        {children}
      </h4>
    );
  return (
    <p className={textClass} style={style}>
      {children}
    </p>
  );
}
