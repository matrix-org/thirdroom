import { ReactNode, MouseEvent } from "react";
import classNames from "classnames";
import "./RoomTile.css";

interface IRoomTile {
  avatar: ReactNode;
  content: ReactNode;
  options?: ReactNode;
  isActive?: boolean;
  isFocused?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function RoomTile({ avatar, content, options, isActive = false, isFocused = false, onClick }: IRoomTile) {
  const roomTileClass = classNames(
    "RoomTile",
    { "RoomTile--active": isActive },
    { "RoomTile--focused": isFocused },
    "flex items-center"
  );

  return (
    <div className={roomTileClass}>
      <button onClick={onClick} className="grow flex items-center gap-sm">
        <div className="RoomTile__avatar shrink-0 flex">{avatar}</div>
        <div className="RoomTile__content grow">{content}</div>
      </button>
      {options && <div className="RoomTile__options shrink-0">{options}</div>}
    </div>
  );
}
