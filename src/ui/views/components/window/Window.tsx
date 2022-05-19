import { ReactNode } from "react";
import classNames from "classnames";

import "./Window.css";

interface WindowProps {
  className?: string;
  children: ReactNode;
}

export function Window({ className, children }: WindowProps) {
  const windowClass = classNames("Window flex", className);

  return <div className={windowClass}>{children}</div>;
}
