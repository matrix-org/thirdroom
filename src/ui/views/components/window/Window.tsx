import { ReactNode } from "react";
import classNames from "classnames";

import "./Window.css";
import { useKeyDown } from "../../../hooks/useKeyDown";

interface WindowProps {
  className?: string;
  onRequestClose?: () => void;
  children: ReactNode;
}

export function Window({ className, onRequestClose, children }: WindowProps) {
  useKeyDown((e) => {
    if (e.key === "Escape") onRequestClose?.();
  }, []);

  return <div className={classNames("Window flex flex-column", className)}>{children}</div>;
}
