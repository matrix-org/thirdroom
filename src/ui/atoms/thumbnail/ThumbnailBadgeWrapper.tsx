import { ReactNode } from "react";
import "./ThumbnailBadgeWrapper.css";

interface ThumbnailBadgeWrapperProps {
  badge?: ReactNode;
  children: ReactNode;
}

export function ThumbnailBadgeWrapper({ badge, children }: ThumbnailBadgeWrapperProps) {
  return (
    <div className="ThumbnailBadgeWrapper">
      {children}
      {badge && <div className="ThumbnailBadgeWrapper__item">{badge}</div>}
    </div>
  );
}
