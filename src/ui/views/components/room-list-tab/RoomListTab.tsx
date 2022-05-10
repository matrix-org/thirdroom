import { MouseEvent } from "react";
import classNames from "classnames";

import { Icon } from "../../../atoms/icon/Icon";

import "./RoomListTab.css";
interface IRoomListTab {
  className?: string;
  iconSrc: string;
  name: string;
  isActive?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function RoomListTab({ className, iconSrc, name, isActive = false, onClick }: IRoomListTab) {
  const avatarIconClass = classNames("RoomListTab", { ["RoomListTab--active"]: isActive }, className);

  return (
    <button onClick={onClick} type="button" className={avatarIconClass} aria-label={name}>
      <Icon color={isActive ? "primary" : "surface-low"} src={iconSrc} size="md" />
    </button>
  );
}
