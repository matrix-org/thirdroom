import { ReactNode } from "react";
import classNames from "classnames";

import { Content } from "../../../atoms/content/Content";
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
      <Content className="WindowContent__main grow">{children}</Content>
      {aside && <aside className="WindowContent__aside">{aside}</aside>}
    </div>
  );
}
