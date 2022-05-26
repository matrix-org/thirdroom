import { ReactNode } from "react";
import classNames from "classnames";

import "./LoadingScreen.css";

interface LoadingScreenProps {
  className?: string;
  children: ReactNode;
}

export function LoadingScreen({ className, children }: LoadingScreenProps) {
  return (
    <div className={classNames("LoadingScreen flex flex-column justify-center items-center", className)}>
      {children}
    </div>
  );
}
