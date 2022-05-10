import { ReactNode } from "react";

import "./AvatarOutline.css";

interface IAvatarOutline {
  children: ReactNode;
}

export function AvatarOutline({ children }: IAvatarOutline) {
  return <div className="AvatarOutline">{children}</div>;
}
