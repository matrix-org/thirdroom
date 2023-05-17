import classNames from "classnames";
import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";

import "./ToolbarButton.css";
import { Text } from "../../../atoms/text/Text";

interface ToolbarButtonProps {
  className?: string;
  active?: boolean;
  outlined?: boolean;
  before?: ReactNode;
  after?: ReactNode;
  children?: ReactNode;
}

export const ToolbarButton = forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps & ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, active, outlined, before, after, children, ...props }, ref) => (
  <button
    className={classNames(
      "ToolbarButton",
      {
        "ToolbarButton--ui-before": before,
        "ToolbarButton--ui-after": after,
        "ToolbarButton--outlined": outlined,
      },
      className
    )}
    type="button"
    aria-pressed={active}
    {...props}
    ref={ref}
  >
    {before}
    {typeof children === "string" ? (
      <Text className="truncate" variant="b3" weight="semi-bold">
        {children}
      </Text>
    ) : (
      children
    )}
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
