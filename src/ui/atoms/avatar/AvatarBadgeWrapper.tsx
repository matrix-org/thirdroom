import "./AvatarBadgeWrapper.css";

interface IAvatarBadgeWrapper {
  badge: React.ReactNode;
  children: React.ReactNode;
}

export function AvatarBadgeWrapper({ badge, children }: IAvatarBadgeWrapper) {
  return (
    <div className="AvatarBadgeWrapper">
      {children}
      <div className="AvatarBadgeWrapper__item">{badge}</div>
    </div>
  );
}
