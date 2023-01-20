import { ReactNode } from "react";
import classNames from "classnames";
import "./Header.css";

interface HeaderProps {
  className?: string;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export function Header({ className, left, center, right }: HeaderProps) {
  return (
    <header className={classNames("Header", className)}>
      {left && <div className="Header__left">{left}</div>}
      {center && <div className="Header__center">{center}</div>}
      {right || (center && <div className="Header__right">{right}</div>)}
    </header>
  );
}
