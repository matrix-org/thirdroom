import classNames from "classnames";

import { Text } from "../text/Text";
import "./SegmentControlItem.css";

interface SegmentControlItemProps<T> {
  className?: string;
  value: T;
  isSelected?: boolean;
  onSelect: (value: T) => void;
  children: string;
}

export function SegmentControlItem<T>({
  className,
  value,
  isSelected = false,
  onSelect,
  children,
}: SegmentControlItemProps<T>) {
  return (
    <button
      className={classNames("SegmentControlItem", { "SegmentControlItem--selected": isSelected }, className)}
      onClick={() => onSelect(value)}
    >
      <Text variant="b2" color={isSelected ? "primary" : "surface"} weight={isSelected ? "bold" : "medium"}>
        {children}
      </Text>
    </button>
  );
}
