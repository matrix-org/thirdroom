import { ReactNode } from "react";
import "./ThumbnailHover.css";

interface ThumbnailHoverPops {
  content?: ReactNode;
  children: ReactNode;
}

export function ThumbnailHover({ content, children }: ThumbnailHoverPops) {
  return (
    <div className="ThumbnailHover">
      {children}
      {content && <div className="ThumbnailHover__content">{content}</div>}
    </div>
  );
}
