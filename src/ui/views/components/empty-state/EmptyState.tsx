import { CSSProperties, ReactNode } from "react";
import classNames from "classnames";

import { Text } from "../../../atoms/text/Text";
import "./EmptyState.css";

interface EmptyStateProps {
  className?: string;
  style?: CSSProperties;
  heading: string | ReactNode;
  text: string | ReactNode;
  actions?: ReactNode;
}

export function EmptyState({ className, style, heading, text, actions }: EmptyStateProps) {
  return (
    <div
      style={style}
      className={classNames("EmptyState text-center flex flex-column justify-center items-center gap-md", className)}
    >
      <div className="flex flex-column gap-xs">
        <Text weight="semi-bold">{heading}</Text>
        <Text variant="b3">{text}</Text>
      </div>
      {actions && <div className="flex gap-xs">{actions}</div>}
    </div>
  );
}
