import React from "react";
import "./Thumbnail.css";

import { Text } from "../text/Text";

interface IThumbnail {
  className?: string;
  name: string;
  bgColor: string;
  imageSrc?: string | undefined | null;
  size?: "large" | "normal";
}

export function Thumbnail({ className, name, bgColor, imageSrc = undefined, size = "normal" }: IThumbnail) {
  const classes = ["Thumbnail"];
  classes.push(`Thumbnail--${size}`);
  if (typeof className === "string") classes.push(className);

  const style: React.CSSProperties = {};
  if (!imageSrc) style.backgroundColor = bgColor;
  return (
    <div className={classes.join(" ")} style={style}>
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
