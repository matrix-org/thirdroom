import React from "react";
import classNames from "classnames";

import { Icon } from "../icon/Icon";
import { RawButton } from "./RawButton";

import "./IconButton.css";
interface IIconButton {
  className?: string;
  variant?: "surface" | "primary" | "secondary" | "positive" | "danger";
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
  isCircle = false,
  shadedSurface = false,
  iconSrc,
  label,
  type = "button",
  onClick,
  disabled = false,
}: IIconButton) {
  const btnClass = classNames(
    `IconButton IconButton--${size}`,
    {
      "IconButton--shaded": shadedSurface && variant === "surface",
      "Icon-Button--circle": isCircle,
    },
    className
  );

  return (
    <RawButton
      className={btnClass}
      variant={variant}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <Icon size={size} src={iconSrc} />
    </RawButton>
  );
}
