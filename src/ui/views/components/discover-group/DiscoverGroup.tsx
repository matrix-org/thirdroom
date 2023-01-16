import { MouseEvent, ReactNode } from "react";
import classNames from "classnames";

import { Icon } from "../../../atoms/icon/Icon";
import { Text } from "../../../atoms/text/Text";

interface DiscoverGroupProps {
  className?: string;
  label: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
}

export function DiscoverGroup({ className, label, content, footer }: DiscoverGroupProps) {
  return (
    <div className={classNames("flex flex-column gap-xs", className)}>
      {label}
      {content}
      {footer}
    </div>
  );
}

interface DiscoverGroupGridProps {
  className?: string;
  itemMinWidth?: number;
  gap?: "xxs" | "xs" | "sm" | "md" | "lg" | "xs";
  children: ReactNode | ReactNode[];
}
export function DiscoverGroupGrid({ className, itemMinWidth = 475, gap = "xs", children }: DiscoverGroupGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridGap: `var(--sp-${gap})`,
        gridTemplateColumns: `repeat(auto-fit, minmax(${itemMinWidth}px, 1fr))`,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

interface DiscoverMoreButtonProps {
  className?: string;
  text?: string;
  iconSrc?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}
export function DiscoverMoreButton({ className, text, iconSrc, onClick }: DiscoverMoreButtonProps) {
  return (
    <button
      style={{ cursor: "pointer" }}
      className={classNames("flex items-center gap-sm", className)}
      onClick={onClick}
      type="button"
    >
      <Text variant="b3" weight="bold">
        {text}
      </Text>
      {iconSrc && <Icon size="sm" src={iconSrc} />}
    </button>
  );
}
