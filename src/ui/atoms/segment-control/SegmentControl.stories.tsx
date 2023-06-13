import { Meta } from "@storybook/react";

import { SegmentControl } from "./SegmentControl";
import { SegmentControlItem } from "./SegmentControlItem";

export default {
  title: "SegmentControl",
  component: SegmentControl,
} as Meta<typeof SegmentControl>;

export function SegmentControlStories() {
  return (
    <div>
      <SegmentControl>
        <SegmentControlItem value="Overview" isSelected={true} onSelect={() => false}>
          Overview
        </SegmentControlItem>
        <SegmentControlItem value="Inventory" onSelect={() => false}>
          Inventory
        </SegmentControlItem>
      </SegmentControl>
    </div>
  );
}
