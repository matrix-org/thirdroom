import { ReactNode } from "react";
import classNames from "classnames";

import "./WindowContent.css";

interface WindowContentProps {
  className?: string;
  children: ReactNode;
  aside?: ReactNode;
}

export function WindowContent({ className, children, aside }: WindowContentProps) {
  const contentClass = classNames("WindowContent flex", className);

  return (
    <div className={contentClass}>
      <div className="WindowContent__main grow flex">{children}</div>
      {aside && <aside className="WindowContent__aside">{aside}</aside>}
    </div>
  );
}
