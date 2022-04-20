import classNames from "classnames";

import { Text } from "./Text";

interface ILabel {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  htmlFor?: string;
  children: React.ReactNode;
}

export function Label({ id, className, style, htmlFor, children }: ILabel) {
  const textClass = classNames(`Label`, className);

  return (
    <Text variant="b3" weight="bold" type="label" id={id} className={textClass} style={style} htmlFor={htmlFor}>
      {children}
    </Text>
  );
}
