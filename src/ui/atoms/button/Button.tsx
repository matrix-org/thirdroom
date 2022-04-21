import React from "react";
import classNames from "classnames";

import { Text } from "../text/Text";

import "./Button.css";
interface IButton {
  className?: string;
  variant?: "primary" | "secondary" | "danger";
  fill?: "solid" | "outline";
  size?: "md" | "lg" | "xl";
  type?: "button" | "submit" | "reset";
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
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
}: IButton) {
  const btnClass = classNames(`Button Button--${variant} Button--${fill} Button--${size}`, className);
  const textColor: "primary" | "on-primary" | "secondary" | "on-secondary" | "danger" | "on-danger" =
    fill === "solid" ? `on-${variant}` : variant;

  let renderChild;

  const getText = (text: string, key?: number | string) => (
    <Text key={key} variant="b2" color={textColor} weight="semi-bold">
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
    <button className={btnClass} type={type} onClick={onClick} disabled={disabled}>
      {renderChild}
    </button>
  );
}
