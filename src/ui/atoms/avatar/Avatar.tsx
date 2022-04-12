import React, { useState } from "react";
import "./Avatar.css";

import { Text } from "../text/Text";

interface IAvatar {
  className?: string;
  name: string;
  bgColor: string;
  isCircle?: boolean;
  imageSrc?: string | undefined | null;
  size?: "extra-large" | "large" | "normal" | "small" | "extra-small" | "ultra-large";
}

export function Avatar({ className, name, bgColor, isCircle = false, imageSrc = undefined, size = "normal" }: IAvatar) {
  const [isFallback, setIsFallback] = useState(false);

  let textSize: "h2" | "s1" | "b1" | "b3" = "h2";
  if (size === "extra-large") textSize = "h2";
  else if (size === "large") textSize = "s1";
  else if (size === "normal" || size == "small") textSize = "b1";
  else textSize = "b3";

  const classes = ["Avatar", `Avatar--${size}`];
  if (isCircle) classes.push("Avatar--circle");
  if (className) classes.push(className);
  classes.push("noselect");

  const style: React.CSSProperties = {};
  if (isFallback || !imageSrc) style.backgroundColor = bgColor;

  return (
    <div className={classes.join(" ")} aria-label={name} style={style}>
      {!isFallback && imageSrc ? (
        <img draggable="false" src={imageSrc} alt="" onError={() => setIsFallback(true)} />
      ) : (
        <Text variant={textSize} weight="medium" type="span">
          {[...name][0]}
        </Text>
      )}
    </div>
  );
}
