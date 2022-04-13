import React from "react";
import classNames from "classnames";
import "./Thumbnail.css";

import { Text } from "../text/Text";

interface IThumbnail {
  className?: string;
  name: string;
  bgColor: string;
  imageSrc?: string | null;
  size?: "large" | "normal";
}

export function Thumbnail({ className, name, bgColor, imageSrc, size = "normal" }: IThumbnail) {
  const thumbnailClass = classNames("Thumbnail", `Thumbnail--${size}`, className);
  const style: React.CSSProperties = {};
  if (!imageSrc) style.backgroundColor = bgColor;
  return (
    <div className={thumbnailClass} style={style}>
      {imageSrc ? (
        <img draggable="false" src={imageSrc} alt="" />
      ) : (
        <Text variant="h2" weight="semi-bold" type="span">
          {[...name][0]}
        </Text>
      )}
    </div>
  );
}
