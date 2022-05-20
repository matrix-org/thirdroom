import { ReactNode } from "react";
import classNames from "classnames";

import "./Window.css";

interface WindowProps {
  className?: string;
  children: ReactNode;
}

export function Window({ className, children }: WindowProps) {
  return <div className={classNames("Window flex", className)}>{children}</div>;
}
