import { Meta } from "@storybook/react";

import { NotificationBadge } from "./NotificationBadge";

export default {
  title: "NotificationBadge",
  component: NotificationBadge,
} as Meta<typeof NotificationBadge>;

export const NotificationBadgeStories = () => {
  return (
    <div className="flex">
      <NotificationBadge />
      <NotificationBadge content="5" />
      <NotificationBadge content="95" variant="secondary" />
      <NotificationBadge content="99+" variant="danger" />
    </div>
  );
};
