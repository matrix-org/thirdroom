import React from "react";
import classNames from "classnames";

import { Icon } from "../icon/Icon";

import "./IconButton.css";
interface IIconButton {
  className?: string;
  variant?: "surface" | "primary" | "positive" | "danger";
  size?: "normal" | "small";
  isCircle?: boolean;
  shadedSurface?: boolean;
  iconSrc: string;
  label: string;
  type?: "button" | "submit" | "reset";
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export function IconButton({
  className,
  variant = "surface",
  size = "normal",
  iconSrc,
  label,
  type = "button",
  onClick,
  disabled = false,
}: IIconButton) {
  const btnClass = classNames(`IconButton IconButton--${variant}`, className);

  return (
    <button className={btnClass} type={type} onClick={onClick} disabled={disabled} aria-label={label}>
      <Icon size={size} src={iconSrc} />
    </button>
  );
}
