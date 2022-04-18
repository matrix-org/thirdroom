import "./AvatarOutline.css";

interface IAvatarOutline {
  children: React.ReactNode;
}

export function AvatarOutline({ children }: IAvatarOutline) {
  return <div className="AvatarOutline">{children}</div>;
}
