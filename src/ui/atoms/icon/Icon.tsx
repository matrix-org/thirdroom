import React, { CSSProperties } from "react";
import classNames from "classnames";
import "./Icon.css";

interface IIcon {
  className?: string;
  color?:
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
  size?: "xl" | "lg" | "md" | "sm" | "xs";
  src: string;
  isImage?: boolean;
}

export function Icon({ className, color = "surface", size = "md", src, isImage = false }: IIcon) {
  const style: CSSProperties = {};

  if (isImage) {
    style.backgroundColor = "transparent";
    style.backgroundImage = `url(${src})`;
  } else {
    style.WebkitMaskImage = `url(${src})`;
    style.maskImage = `url(${src})`;
  }

  return <span className={classNames(`Icon Icon--${color} Icon--${size}`, className)} style={style} />;
}
