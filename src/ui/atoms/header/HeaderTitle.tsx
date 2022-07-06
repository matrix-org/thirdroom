import { ReactNode } from "react";
import classNames from "classnames";

import { Text } from "../text/Text";

import "./HeaderTitle.css";
interface HeaderTitleProps {
  className?: string;
  size?: "md" | "lg";
  icon?: ReactNode;
  children: string;
}

export function HeaderTitle({ className, size = "md", icon, children }: HeaderTitleProps) {
  return (
    <div className={classNames("HeaderTitle", className)}>
      {icon}
      <Text variant={size === "md" ? "b2" : "b1"} weight="bold">
        {children}
      </Text>
    </div>
  );
}
