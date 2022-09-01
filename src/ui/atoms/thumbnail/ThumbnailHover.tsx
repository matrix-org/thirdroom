import { ReactNode } from "react";
import classNames from "classnames";
import "./ThumbnailHover.css";

interface ThumbnailHoverPops {
  className?: string;
  content?: ReactNode;
  children: ReactNode;
}

export function ThumbnailHover({ className, content, children }: ThumbnailHoverPops) {
  return (
    <div className={classNames("ThumbnailHover", className)}>
      {children}
      {content && <div className="ThumbnailHover__content">{content}</div>}
    </div>
  );
}
