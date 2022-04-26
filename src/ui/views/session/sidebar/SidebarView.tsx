import classNames from "classnames";

import "./SidebarView.css";

interface SidebarViewProps {
  open: boolean;
  spaces: React.ReactNode;
  roomList: React.ReactNode;
}

export function SidebarView({ open, spaces, roomList }: SidebarViewProps) {
  const sidebarClass = classNames("SidebarView", { ["SidebarView--close"]: !open }, "flex");

  return (
    <div className={sidebarClass}>
      <div className="SidebarView__bar shrink-0 flex">{spaces}</div>
      <div className="grow flex">{roomList}</div>
    </div>
  );
}
