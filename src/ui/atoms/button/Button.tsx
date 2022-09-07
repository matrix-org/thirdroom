import { ReactNode, MouseEvent } from "react";
import classNames from "classnames";

import { Text } from "../text/Text";

import "./Button.css";
export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonFill = "solid" | "outline";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
interface IButton {
  className?: string;
  variant?: ButtonVariant;
  fill?: ButtonFill;
  size?: ButtonSize;
  type?: "button" | "submit" | "reset";
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  disabled?: boolean;
  id?: string;
}

export function Button({
  className,
  variant = "primary",
  fill = "solid",
  size = "md",
  type = "button",
  onClick,
  children,
  disabled = false,
  id,
}: IButton) {
  const btnClass = classNames(`Button Button--${variant} Button--${fill} Button--${size}`, className);
  const textColor: "primary" | "on-primary" | "secondary" | "on-secondary" | "danger" | "on-danger" =
    fill === "solid" ? `on-${variant}` : variant;

  let renderChild;

  const getText = (text: string, key?: number | string) => (
    <Text key={key} variant={size === "xs" ? "b3" : "b2"} color={textColor} weight="semi-bold">
      {text}
    </Text>
  );

  if (typeof children === "string") {
    renderChild = getText(children);
  } else if (Array.isArray(children)) {
    renderChild = children.map((child, index) => {
      if (typeof child === "string") return getText(child, index);
      else return child;
    });
  } else renderChild = children;

  return (
    <button id={id} className={btnClass} type={type} onClick={onClick} disabled={disabled}>
      {renderChild}
    </button>
  );
}
