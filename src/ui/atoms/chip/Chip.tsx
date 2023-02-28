import classNames from "classnames";
import { ReactNode, MouseEvent } from "react";

import "./Chip.css";

interface ChipProps {
  className?: string;
  size?: "md" | "sm";
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function Chip({ className, size = "md", children, onClick }: ChipProps) {
  const classes = classNames("Chip", `Chip--${size}`, { "Chip--clickable": onClick }, className);

  if (onClick)
    return (
      <button className={classes} type="button" onClick={onClick}>
        {children}
      </button>
    );

  return <div className={classes}>{children}</div>;
}
