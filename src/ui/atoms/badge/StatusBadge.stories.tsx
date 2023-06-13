import { Meta } from "@storybook/react";

import { StatusBadge } from "./StatusBadge";

export default {
  title: "StatusBadge",
  component: StatusBadge,
} as Meta<typeof StatusBadge>;

export function StatusBadgeStories() {
  return (
    <div className="flex">
      <StatusBadge status="offline" />
      <StatusBadge status="online" />
      <StatusBadge status="dnd" />
    </div>
  );
}
