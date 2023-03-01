import classNames from "classnames";
import { CSSProperties, MouseEventHandler, ReactNode } from "react";

import "./EditorHeader.css";

export function EditorHeader({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={classNames("EditorHeader", className)} style={style}>
      {children}
    </div>
  );
}

export function EditorHeaderTab({
  active = false,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}) {
  return (
    <button onClick={onClick} className={classNames("EditorHeaderTab", { "EditorHeaderTab--active": active })}>
      {children}
    </button>
  );
}
