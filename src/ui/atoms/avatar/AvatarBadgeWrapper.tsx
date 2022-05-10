import { ReactNode } from "react";

import "./AvatarBadgeWrapper.css";

interface IAvatarBadgeWrapper {
  badge: ReactNode;
  children: ReactNode;
}

export function AvatarBadgeWrapper({ badge, children }: IAvatarBadgeWrapper) {
  return (
    <div className="AvatarBadgeWrapper">
      {children}
      <div className="AvatarBadgeWrapper__item">{badge}</div>
    </div>
  );
}
