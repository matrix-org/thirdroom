import classNames from "classnames";
import { ReactNode } from "react";

import { Text } from "../text/Text";

import "./NotificationBadge.css";

interface INotificationBadge {
  className?: string;
  variant?: "primary" | "secondary" | "danger";
  content?: string | number | ReactNode;
}

export function NotificationBadge({ className, variant = "primary", content }: INotificationBadge) {
  const hasContent = content !== undefined;
  const notifClass = classNames(
    "NotificationBadge",
    `NotificationBadge--${variant}`,
    { "NotificationBadge--with-content": hasContent },
    className
  );

  return (
    <span className={notifClass}>
      {hasContent &&
        (typeof content === "string" || typeof content === "number" ? (
          <Text variant="b3" color={`on-${variant}`} type="span" weight="semi-bold">
            {content}
          </Text>
        ) : (
          content
        ))}
    </span>
  );
}
