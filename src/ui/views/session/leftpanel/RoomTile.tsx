import "./RoomTile.css";

interface IRoomTile {
  title: React.ReactNode;
  avatar: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
}

export function RoomTile({
  title,
  avatar,
  isActive = false,
  onClick
}: IRoomTile) {
  return (
    <button onClick={onClick} className={`RoomTile${isActive ? "--active" : ""} flex items-start`}>
      {avatar}
      <div className="RoomTile__content grow flex flex-column">
        {title}
      </div>
    </button>
  );
}
