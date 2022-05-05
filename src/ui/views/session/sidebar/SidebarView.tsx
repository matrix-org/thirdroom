import classNames from "classnames";

import "./SidebarView.css";

interface SidebarViewProps {
  spaces: React.ReactNode;
  roomList?: React.ReactNode;
}

export function SidebarView({ spaces, roomList }: SidebarViewProps) {
  const sidebarClass = classNames("SidebarView", { ["SidebarView--close"]: !open }, "flex");

  return (
    <div className={sidebarClass}>
      <div className="shrink-0 flex">{spaces}</div>
      {roomList && <div className="grow flex">{roomList}</div>}
    </div>
  );
}
