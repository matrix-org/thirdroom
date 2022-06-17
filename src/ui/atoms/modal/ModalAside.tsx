import { ReactNode } from "react";
import classNames from "classnames";

import "./ModalAside.css";

interface ModalAsideProps {
  className?: string;
  children: ReactNode;
}

export function ModalAside({ className, children }: ModalAsideProps) {
  const asideClass = classNames("ModalAside", className);

  return <div className={asideClass}>{children}</div>;
}
