import { ReactNode } from "react";

import "./MemberTile.css";

interface MemberTileProps {
  avatar: ReactNode;
  content: ReactNode;
  options?: ReactNode;
}

export function MemberTile({ avatar, content, options }: MemberTileProps) {
  return (
    <div className="MemberTile items-center flex gap-sm">
      <div className="shrink-0 flex">{avatar}</div>
      <div className="grow">{content}</div>
      {options && <div className="shrink-0">{options}</div>}
    </div>
  );
}
