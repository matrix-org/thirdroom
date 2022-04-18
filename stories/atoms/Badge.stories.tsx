import { StatusBadge } from "../../src/ui/atoms/badge/StatusBadge";

export function BadgeStories() {
  return (
    <div className="flex">
      <StatusBadge status="offline" />
      <StatusBadge status="online" />
      <StatusBadge status="dnd" />
    </div>
  );
}
