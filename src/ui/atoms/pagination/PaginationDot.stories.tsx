import { Meta } from "@storybook/react";

import { PaginationDot } from "./PaginationDot";

export default {
  title: "PaginationDot",
  component: PaginationDot,
} as Meta<typeof PaginationDot>;

export function PaginationDotStories() {
  return (
    <div className="flex">
      <PaginationDot max={3} value={1} />
    </div>
  );
}
