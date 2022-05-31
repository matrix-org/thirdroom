import { ReactNode } from "react";
import classNames from "classnames";

import "./WindowAside.css";

interface WindowAsideProps {
  className?: string;
  children: ReactNode;
}

export function WindowAside({ className, children }: WindowAsideProps) {
  const asideClass = classNames("WindowAside", className);

  return <div className={asideClass}>{children}</div>;
}
