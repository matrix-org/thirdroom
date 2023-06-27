import { Meta } from "@storybook/react";

import { Dots } from "./Dots";

export default {
  title: "Dots",
  component: Dots,
} as Meta<typeof Dots>;

export function DotsStories() {
  return (
    <div className="flex gap-md">
      <Dots size="sm" />
      <Dots />
      <Dots size="lg" />
      <Dots paused />
    </div>
  );
}
