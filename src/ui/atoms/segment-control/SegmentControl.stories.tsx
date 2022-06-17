import { SegmentControl } from "./SegmentControl";
import { SegmentControlItem } from "./SegmentControlItem";

export const title = "SegmentControl";

export default function SegmentControlStories() {
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
