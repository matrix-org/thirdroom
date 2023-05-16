import { ReactNode } from "react";
import classNames from "classnames";

import "./Toolbar.css";

interface ToolbarProps {
  className?: string;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export function Toolbar({ className, center, left, right }: ToolbarProps) {
  return (
    <div className={classNames("Toolbar", className)}>
      <div className="grow basis-0 flex items-center">{left}</div>
      <div className="shrink-0 basis-0 flex items-center justify-center">{center}</div>
      <div className="grow basis-0 flex items-center justify-end">{right}</div>
    </div>
  );
}

interface ToolbarItemGroupProps {
  className?: string;
  children?: ReactNode;
}

export function ToolbarItemGroup({ className, children }: ToolbarItemGroupProps) {
  return <div className={classNames("ToolbarItemGroup", className)}>{children}</div>;
}
