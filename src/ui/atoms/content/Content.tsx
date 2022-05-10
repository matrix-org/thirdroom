import { ReactNode } from "react";
import classNames from "classnames";
import "./Content.css";

interface ContentProps {
  className?: string;
  top?: ReactNode;
  children?: ReactNode;
  bottom?: ReactNode;
}

export function Content({ className, top, children, bottom }: ContentProps) {
  const sectionClass = classNames("Content", className);

  return (
    <div className={sectionClass}>
      {top && <div className="Content__top">{top}</div>}
      {children && <div className="Content__grow">{children}</div>}
      {bottom && <div className="Content__bottom">{bottom}</div>}
    </div>
  );
}
