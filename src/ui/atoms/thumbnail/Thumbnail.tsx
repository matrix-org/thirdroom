import classNames from "classnames";
import "./Thumbnail.css";

interface ThumbnailProps {
  className?: string;
  bgColor?: string;
  size?: "md" | "sm";
  children: React.ReactNode;
}

export function Thumbnail({ className, bgColor, size = "md", children }: ThumbnailProps) {
  const thumbnailClass = classNames("Thumbnail", `Thumbnail--${size}`, className);
  const style: React.CSSProperties = {};
  if (bgColor) style.backgroundColor = bgColor;
  return (
    <div className={thumbnailClass} style={style}>
      {children}
    </div>
  );
}
