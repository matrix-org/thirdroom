import { Meta } from "@storybook/react";

import { Kbd } from "./Kbd";

export default {
  title: "Kbd",
  component: Kbd,
} as Meta<typeof Kbd>;

export function KbdStories() {
  return (
    <div className="flex items-center gap-md">
      <Kbd size="xs">S</Kbd>
      <Kbd size="xs">Shift + S</Kbd>
      <Kbd size="sm">Q</Kbd>
      <Kbd size="sm">CMD + Q</Kbd>
      <Kbd>M</Kbd>
      <Kbd>Fn + M</Kbd>
      <Kbd size="lg">H</Kbd>
      <Kbd size="lg">Space + H</Kbd>
      <span style={{ padding: "8px", backgroundColor: "gray" }}>
        <Kbd variant="world">Shift + 1</Kbd>
      </span>
    </div>
  );
}
