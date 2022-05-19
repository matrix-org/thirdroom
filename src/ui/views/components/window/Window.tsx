import { ReactNode } from "react";
import classNames from "classnames";

import { Content } from "../../../atoms/content/Content";
import "./Window.css";

interface WindowProps {
  className?: string;
  children: ReactNode;
}

export function Window({ className, children }: WindowProps) {
  const windowClass = classNames("Window", className);

  return <Content className={windowClass}>{children}</Content>;
}
