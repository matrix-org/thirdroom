import classNames from "classnames";

import { Text } from "../text/Text";

import "./NotificationBadge.css";

interface INotificationBadge {
  className?: string;
  variant?: "primary" | "secondary" | "danger";
  content?: string;
}

export function NotificationBadge({ className, variant = "primary", content }: INotificationBadge) {
  const hasContent = typeof content === "string";
  const notifClass = classNames(
    "NotificationBadge",
    `NotificationBadge--${variant}`,
    { "NotificationBadge--with-content": hasContent },
    className
  );

  return (
    <span className={notifClass}>
      {hasContent && (
        <Text variant="b3" color={`on-${variant}`} type="span" weight="semi-bold">
          {content}
        </Text>
      )}
    </span>
  );
}
