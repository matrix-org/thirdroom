import React, { useState } from "react";
import classNames from "classnames";
import "./Avatar.css";

import { Text } from "../text/Text";

interface IAvatar {
  className?: string;
  name: string;
  bgColor: string;
  fgColor?: string;
  shape?: "rounded" | "circle";
  imageSrc?: string | null;
  size?: "xl" | "lg" | "md" | "sm" | "xs" | "xxs";
}

export function Avatar({
  className,
  name,
  bgColor,
  fgColor = "white",
  shape = "rounded",
  imageSrc,
  size = "md",
}: IAvatar) {
  const [isFallback, setIsFallback] = useState(true);

  let textSize: "h2" | "s1" | "b1" | "b3" = "h2";
  if (size === "xl") textSize = "h2";
  else if (size === "lg") textSize = "s1";
  else if (size === "md" || size == "sm") textSize = "b1";
  else textSize = "b3";

  const avatarClass = classNames(
    "Avatar",
    `Avatar--${size}`,
    { "Avatar--circle": shape === "circle" },
    className,
    "noselect"
  );

  const style: React.CSSProperties = {};
  if (isFallback || !imageSrc) style.backgroundColor = bgColor;

  return (
    <div className={avatarClass} aria-label={name} style={style}>
      {!isFallback && imageSrc ? (
        <img draggable="false" src={imageSrc} alt="" onLoad={() => setIsFallback(false)} />
      ) : (
        <Text style={{ color: fgColor }} variant={textSize} weight="medium" type="span">
          {[...name][0]}
        </Text>
      )}
    </div>
  );
}
