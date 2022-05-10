import { MouseEvent } from "react";
import classNames from "classnames";

import { Icon } from "../../../atoms/icon/Icon";

import "./SidebarTab.css";
interface ISidebarTab {
  className?: string;
  iconSrc: string;
  name: string;
  variant?: "surface" | "surface-low" | "primary" | "secondary" | "danger";
  isActive?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function SidebarTab({ className, iconSrc, name, variant = "surface", isActive = false, onClick }: ISidebarTab) {
  const avatarIconClass = classNames(
    `SidebarTab SidebarTab--${variant}`,
    { ["SidebarTab--active"]: isActive },
    className
  );
  const iconColor: "surface-low" | "on-primary" | "on-secondary" | "on-danger" =
    variant === "surface" || variant === "surface-low" ? "surface-low" : `on-${variant}`;

  return (
    <button onClick={onClick} type="button" className={avatarIconClass} aria-label={name}>
      <Icon color={iconColor} src={iconSrc} size="md" />
    </button>
  );
}
