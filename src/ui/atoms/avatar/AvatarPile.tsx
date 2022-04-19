import "./AvatarPile.css";

interface IAvatarPile {
  children: React.ReactNode;
}

export function AvatarPile({ children }: IAvatarPile) {
  return <div className="AvatarPile">{children}</div>;
}
