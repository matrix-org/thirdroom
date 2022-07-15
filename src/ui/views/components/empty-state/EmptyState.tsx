import { ReactNode } from "react";
import classNames from "classnames";

import { Text } from "../../../atoms/text/Text";
import "./EmptyState.css";

interface EmptyStateProps {
  className?: string;
  heading: string | ReactNode;
  text: string | ReactNode;
  actions: ReactNode;
}

export function EmptyState({ className, heading, text, actions }: EmptyStateProps) {
  return (
    <div className={classNames("EmptyState text-center flex flex-column items-center gap-md", className)}>
      <div className="flex flex-column gap-xs">
        <Text weight="semi-bold">{heading}</Text>
        <Text variant="b3">{text}</Text>
      </div>
      {actions && <div className="flex gap-xs">{actions}</div>}
    </div>
  );
}
