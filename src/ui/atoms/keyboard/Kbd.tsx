import { ReactNode } from "react";
import classNames from "classnames";

import { Text } from "../text/Text";
import "./Kbd.css";

interface KbdProps {
  className?: string;
  variant?: "surface" | "world";
  size?: "xs" | "sm" | "md" | "lg";
  children: ReactNode;
}

export function Kbd({ variant = "surface", size = "md", children }: KbdProps) {
  let textSize: "b1" | "b2" | "b3" = "b1";
  if (size === "sm") textSize = "b2";
  if (size === "xs") textSize = "b3";

  return (
    <kbd className={classNames("Kbd", `Kbd--${variant} Kbd--${size}`)}>
      {typeof children === "string" ? (
        <Text weight="medium" variant={textSize} color={variant} type="span">
          {children}
        </Text>
      ) : (
        children
      )}
    </kbd>
  );
}
