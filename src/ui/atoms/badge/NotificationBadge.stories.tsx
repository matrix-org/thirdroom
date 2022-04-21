import { NotificationBadge } from "./NotificationBadge";

export const title = "NotificationBadge";

export default function NotificationBadgeStories() {
  return (
    <div className="flex">
      <NotificationBadge />
      <NotificationBadge content="5" />
      <NotificationBadge content="95" variant="secondary" />
      <NotificationBadge content="99+" variant="danger" />
    </div>
  );
}
