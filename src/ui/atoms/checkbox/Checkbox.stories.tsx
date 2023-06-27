import { Meta } from "@storybook/react";

import { Checkbox } from "./Checkbox";

export default {
  title: "Checkbox",
  component: Checkbox,
} as Meta<typeof Checkbox>;

export function CheckboxStories() {
  return (
    <div className="flex">
      <Checkbox onCheckedChange={(v) => console.log(v)} />
      <Checkbox defaultChecked={true} onCheckedChange={(v) => console.log(v)} />
      <Checkbox defaultChecked={true} disabled />
    </div>
  );
}
