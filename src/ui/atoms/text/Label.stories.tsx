import { Meta } from "@storybook/react";

import { Label } from "./Label";

export default {
  title: "Label",
  component: Label,
} as Meta<typeof Label>;

export function LabelStories() {
  return (
    <div className="flex flex-column">
      <Label>My input label</Label>
      <Label htmlFor="profile-input">My profile</Label>
    </div>
  );
}
