import React, { CSSProperties } from "react";
import classNames from "classnames";
import "./Icon.css";

interface IIcon {
  className?: string;
  color?: string;
  size?: "md" | "sm" | "xs";
  src: string;
  isImage?: boolean;
}

export function Icon({ className, color, size = "md", src, isImage = false }: IIcon) {
  const style: CSSProperties = {};
  if (typeof color === "string") style.backgroundColor = color;
  if (isImage) {
    style.backgroundColor = "transparent";
    style.backgroundImage = `url(${src})`;
  } else {
    style.WebkitMaskImage = `url(${src})`;
    style.maskImage = `url(${src})`;
  }

  return <span className={classNames(`Icon Icon--${size}`, className)} style={style} />;
}
