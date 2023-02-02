import { ButtonHTMLAttributes, forwardRef } from "react";
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
  disabled?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IIconButton & ButtonHTMLAttributes<HTMLButtonElement>>(
  (
    { className, variant = "surface", size = "md", iconSrc, label, type = "button", disabled = false, ...props },
    ref
  ) => {
    const btnClass = classNames(`IconButton IconButton--${variant}`, className);

    return (
      <button ref={ref} className={btnClass} type={type} disabled={disabled} aria-label={label} {...props}>
        <Icon color={variant} size={size} src={iconSrc} />
      </button>
    );
  }
);
