import "./ThumbnailBadgeWrapper.css";

interface ThumbnailBadgeWrapperProps {
  badge: React.ReactNode;
  children: React.ReactNode;
}

export function ThumbnailBadgeWrapper({ badge, children }: ThumbnailBadgeWrapperProps) {
  return (
    <div className="ThumbnailBadgeWrapper">
      {children}
      <div className="ThumbnailBadgeWrapper__item">{badge}</div>
    </div>
  );
}
