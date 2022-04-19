import { StatusBadge } from "./StatusBadge";

export const title = "StatusBadge";

export default function BadgeStories() {
  return (
    <div className="flex">
      <StatusBadge status="offline" />
      <StatusBadge status="online" />
      <StatusBadge status="dnd" />
    </div>
  );
}
