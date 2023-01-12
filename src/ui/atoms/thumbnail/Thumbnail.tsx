import { ReactNode, CSSProperties } from "react";
import classNames from "classnames";
import "./Thumbnail.css";

interface ThumbnailProps {
  className?: string;
  bgColor?: string;
  size?: "lg" | "md" | "sm";
  outlined?: boolean;
  wide?: boolean;
  children?: ReactNode;
}

export function Thumbnail({ className, bgColor, size = "md", outlined, wide, children }: ThumbnailProps) {
  const style: CSSProperties = {};
  if (bgColor) style.backgroundColor = bgColor;
  return (
    <div
      className={classNames(
        "Thumbnail",
        `Thumbnail--${size}`,
        { "Thumbnail--outlined": outlined },
        { "Thumbnail--wide": wide },
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
