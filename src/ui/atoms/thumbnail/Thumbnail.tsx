import { ReactNode, CSSProperties } from "react";
import classNames from "classnames";
import "./Thumbnail.css";

interface ThumbnailProps {
  className?: string;
  bgColor?: string;
  size?: "md" | "md-3x5" | "sm" | "sm-3x5";
  children: ReactNode;
}

export function Thumbnail({ className, bgColor, size = "md", children }: ThumbnailProps) {
  const thumbnailClass = classNames("Thumbnail", `Thumbnail--${size}`, className);
  const style: CSSProperties = {};
  if (bgColor) style.backgroundColor = bgColor;
  return (
    <div className={thumbnailClass} style={style}>
      {children}
    </div>
  );
}
