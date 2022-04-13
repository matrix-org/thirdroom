import { ReactNode } from "react";

import "./RoomTile.css";

interface IRoomTile {
  title: ReactNode;
  avatar: ReactNode;
  isActive?: boolean;
  onClick: () => void;
}

export function RoomTile({ title, avatar, isActive = false, onClick }: IRoomTile) {
  return (
    <button onClick={onClick} className={`RoomTile${isActive ? "--active" : ""} flex items-start`}>
      {avatar}
      <div className="RoomTile__content grow flex flex-column">{title}</div>
    </button>
  );
}
