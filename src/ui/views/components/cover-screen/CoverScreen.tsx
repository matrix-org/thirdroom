import { ReactNode } from "react";
import classNames from "classnames";

import "./CoverScreen.css";

interface CoverScreenProps {
  className?: string;
  children: ReactNode;
}

export function CoverScreen({ className, children }: CoverScreenProps) {
  return (
    <div className={classNames("CoverScreen flex flex-column justify-center items-center", className)}>{children}</div>
  );
}
