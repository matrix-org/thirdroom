import { ReactNode } from "react";
import classNames from "classnames";

import "./Footer.css";
interface FooterProps {
  className?: string;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export function Footer({ className, left, center, right }: FooterProps) {
  return (
    <footer className={classNames("Footer", className)}>
      {left && <div className="Footer__left">{left}</div>}
      {center && <div className="Footer__center">{center}</div>}
      {right && <div className="Footer__right">{right}</div>}
    </footer>
  );
}
