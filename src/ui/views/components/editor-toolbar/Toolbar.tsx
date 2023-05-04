import { ReactNode } from "react";
import classNames from "classnames";

import "./Toolbar.css";

interface ToolbarProps {
  className?: string;
  children?: ReactNode;
}

export function Toolbar({ children }: ToolbarProps) {
  return <div className={classNames("Toolbar", classNames)}>{children}</div>;
}

interface ToolbarItemGroupProps {
  className?: string;
  children?: ReactNode;
}

export function ToolbarItemGroup({ className, children }: ToolbarItemGroupProps) {
  return <div className={classNames("ToolbarItemGroup", className)}>{children}</div>;
}
