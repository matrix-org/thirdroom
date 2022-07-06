import classNames from "classnames";
import { ReactNode, MouseEvent } from "react";

import "./Chip.css";

interface ChipProps {
  className?: string;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function Chip({ className, children, onClick }: ChipProps) {
  const classes = classNames("Chip", { "Chip--clickable": onClick }, className);

  if (onClick)
    return (
      <button className={classes} type="button" onClick={onClick}>
        {children}
      </button>
    );

  return <div className={classes}>{children}</div>;
}
