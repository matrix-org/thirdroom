import classNames from "classnames";
import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";

import "./ToolbarButton.css";

interface ToolbarButtonProps {
  className?: string;
  active?: boolean;
  before?: ReactNode;
  after?: ReactNode;
  children?: ReactNode;
}

export const ToolbarButton = forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps & ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, active, before, after, children, ...props }) => (
  <button
    className={classNames(
      "ToolbarButton",
      {
        "ToolbarButton--ui-before": before,
        "ToolbarButton--ui-after": after,
      },
      className
    )}
    type="button"
    aria-pressed={active}
    {...props}
  >
    {before}
    {children}
    {after}
  </button>
));

interface ToolbarButtonGroupProps {
  className?: string;
  children?: ReactNode;
}

export function ToolbarButtonGroup({ className, children }: ToolbarButtonGroupProps) {
  return <div className={classNames("ToolbarButtonGroup", className)}>{children}</div>;
}

export function ToolbarButtonDivider() {
  return <div className="ToolbarButtonDivider" />;
}
