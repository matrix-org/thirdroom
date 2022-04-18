import classNames from "classnames";
import "./RoomTile.css";

interface IRoomTile {
  avatar: React.ReactNode;
  content: React.ReactNode;
  options?: React.ReactNode;
  isActive?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function RoomTile({ avatar, content, options, isActive = false, onClick }: IRoomTile) {
  const roomTileClass = classNames("RoomTile", { "RoomTile--active": isActive }, "flex items-center");

  return (
    <div className={roomTileClass}>
      <button onClick={onClick} className="grow flex items-center">
        <div className="RoomTile__avatar shrink-0">{avatar}</div>
        <div className="RoomTile__content grow">{content}</div>
      </button>
      {options && <div className="RoomTile__options shrink-0">{options}</div>}
    </div>
  );
}
