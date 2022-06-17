import { ReactNode } from "react";
import classNames from "classnames";

import "./ModalContent.css";

interface ModalContentProps {
  className?: string;
  children: ReactNode;
  aside?: ReactNode;
}

export function ModalContent({ className, children, aside }: ModalContentProps) {
  return (
    <div className={classNames("ModalContent flex", className)}>
      <div className="ModalContent__main grow flex">{children}</div>
      {aside && <aside className="ModalContent__aside">{aside}</aside>}
    </div>
  );
}
