import React from "react";
import classNames from "classnames";

import { Text } from "../text/Text";

import "./Button.css";
interface IButton {
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "primary-outline" | "secondary-outline" | "danger-outline";
  size?: "md" | "lg" | "xl";
  type?: "button" | "submit" | "reset";
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  onClick,
  children,
  disabled = false,
}: IButton) {
  const btnClass = classNames(`Button Button--${variant} Button--${size}`, className);

  let renderChild;

  if (typeof children === "string") {
    renderChild = <Text variant="b2">{children}</Text>;
  } else if (Array.isArray(children)) {
    renderChild = children.map((child, index) => {
      if (typeof child === "string")
        return (
          <Text key={index} variant="b2">
            {child}
          </Text>
        );
      else return child;
    });
  } else renderChild = children;

  return (
    <button className={btnClass} type={type} onClick={onClick} disabled={disabled}>
      {renderChild}
    </button>
  );
}
