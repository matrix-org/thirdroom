import { ReactNode, CSSProperties } from "react";
import classNames from "classnames";
import "./Thumbnail.css";

interface ThumbnailProps {
  className?: string;
  bgColor?: string;
  size?: "md" | "sm";
  outlined?: boolean;
  children: ReactNode;
}

export function Thumbnail({ className, bgColor, size = "md", outlined, children }: ThumbnailProps) {
  const style: CSSProperties = {};
  if (bgColor) style.backgroundColor = bgColor;
  return (
    <div
      className={classNames("Thumbnail", `Thumbnail--${size}`, { "Thumbnail--outlined": outlined }, className)}
      style={style}
    >
      {children}
    </div>
  );
}
