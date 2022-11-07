import { useState, CSSProperties, MouseEvent, useEffect } from "react";
import classNames from "classnames";
import "./Avatar.css";

import { Text } from "../text/Text";

interface IAvatar {
  className?: string;
  style?: CSSProperties;
  name: string;
  bgColor: string;
  fgColor?: string;
  shape?: "rounded" | "circle";
  imageSrc?: string | null;
  size?: "xl" | "lg" | "md" | "sm" | "xs" | "xxs";
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function Avatar({
  className,
  style,
  name,
  bgColor,
  fgColor = "white",
  shape = "rounded",
  imageSrc,
  size = "md",
  onClick,
}: IAvatar) {
  const [isFallback, setIsFallback] = useState(false);

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

  style = style ?? {};
  if (isFallback || !imageSrc) style.backgroundColor = bgColor;
  const props = {
    className: avatarClass,
    "aria-label": name,
    style,
  };

  useEffect(() => {
    setIsFallback(false);
  }, [imageSrc]);

  const content =
    !isFallback && imageSrc ? (
      <img draggable="false" src={imageSrc} alt="" onError={() => setIsFallback(true)} />
    ) : (
      <Text style={{ color: fgColor }} variant={textSize} weight="medium" type="span">
        {[...name][0]}
      </Text>
    );

  if (onClick)
    return (
      <button onClick={onClick} {...props}>
        {content}
      </button>
    );
  return <div {...props}>{content}</div>;
}
