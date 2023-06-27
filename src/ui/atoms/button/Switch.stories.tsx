import { Meta } from "@storybook/react";

import { Switch } from "./Switch";

export default {
  title: "Switch",
  component: Switch,
} as Meta<typeof Switch>;

export function SwitchStories() {
  return (
    <div className="flex">
      <Switch onCheckedChange={(v) => console.log(v)} />
      <Switch defaultChecked={true} onCheckedChange={(v) => console.log(v)} />
      <Switch defaultChecked={true} disabled />
    </div>
  );
}
