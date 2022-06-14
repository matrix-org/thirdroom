import { ReactNode } from "react";
import classNames from "classnames";

import { Text } from "../text/Text";

import "./HeaderTitle.css";
interface HeaderTitleProps {
  className?: string;
  icon?: ReactNode;
  children: string;
}

export function HeaderTitle({ className, icon, children }: HeaderTitleProps) {
  return (
    <div className={classNames("HeaderTitle", className)}>
      {icon}
      <Text variant="b2" weight="bold">
        {children}
      </Text>
    </div>
  );
}
