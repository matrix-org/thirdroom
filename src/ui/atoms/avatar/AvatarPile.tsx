import { ReactNode } from "react";

import "./AvatarPile.css";

interface IAvatarPile {
  children: ReactNode;
}

export function AvatarPile({ children }: IAvatarPile) {
  return <div className="AvatarPile">{children}</div>;
}
