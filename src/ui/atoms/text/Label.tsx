import classNames from "classnames";

import { Text } from "./Text";
import type { textColor } from "./Text";

interface ILabel {
  id?: string;
  className?: string;
  color?: textColor;
  style?: React.CSSProperties;
  htmlFor?: string;
  children: React.ReactNode;
}

export function Label({ id, className, color = "surface", style, htmlFor, children }: ILabel) {
  const textClass = classNames(`Label`, className);

  return (
    <Text
      variant="b3"
      color={color}
      weight="bold"
      type="label"
      id={id}
      className={textClass}
      style={style}
      htmlFor={htmlFor}
    >
      {children}
    </Text>
  );
}
