import { Meta } from "@storybook/react";

import { Progress } from "./Progress";

export default {
  title: "Progress",
  component: Progress,
} as Meta<typeof Progress>;

export function ProgressStories() {
  return (
    <div className="flex flex-column gap-md">
      <Progress value={30} max={100} />
      <Progress variant="secondary" value={10} max={100} />
      <Progress variant="danger" value={80} max={100} />
    </div>
  );
}
