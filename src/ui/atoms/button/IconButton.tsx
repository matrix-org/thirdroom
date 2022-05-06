import React from "react";
import classNames from "classnames";

import { Icon } from "../icon/Icon";

import "./IconButton.css";
interface IIconButton {
  className?: string;
  variant?:
    | "surface"
    | "surface-low"
    | "world"
    | "primary"
    | "secondary"
    | "danger"
    | "on-primary"
    | "on-secondary"
    | "on-danger"
    | "tooltip"
    | "link";
  size?: "xl" | "lg" | "md" | "sm";
  iconSrc: string;
  label: string;
  type?: "button" | "submit" | "reset";
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export function IconButton({
  className,
  variant = "surface",
  size = "md",
  iconSrc,
  label,
  type = "button",
  onClick,
  disabled = false,
}: IIconButton) {
  const btnClass = classNames(`IconButton IconButton--${variant}`, className);

  return (
    <button className={btnClass} type={type} onClick={onClick} disabled={disabled} aria-label={label}>
      <Icon color={variant} size={size} src={iconSrc} />
    </button>
  );
}
