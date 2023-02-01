import classNames from "classnames";
import { MouseEventHandler, ReactNode } from "react";

import "./HierarchyHeader.css";

export function HierarchyHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={classNames("HierarchyHeader", className)}>{children}</div>;
}

export function HierarchyHeaderTab({
  active = false,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}) {
  return (
    <button onClick={onClick} className={classNames("HierarchyHeaderTab", { "HierarchyHeaderTab--active": active })}>
      {children}
    </button>
  );
}
