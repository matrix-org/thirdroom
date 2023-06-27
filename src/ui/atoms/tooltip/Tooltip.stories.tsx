import { Meta } from "@storybook/react";

import { Tooltip } from "./Tooltip";
import { IconButton } from "../button/IconButton";
import HomeIC from "../../../../res/ic/home.svg";

export default {
  title: "Tooltip",
  component: Tooltip,
} as Meta<typeof Tooltip>;

export function TooltipStories() {
  return (
    <div className="flex">
      <Tooltip content="Home" side="left">
        <IconButton label="Home" iconSrc={HomeIC} onClick={() => console.log("clicked")} />
      </Tooltip>
      <Tooltip content="Home" side="top">
        <IconButton label="Home" iconSrc={HomeIC} onClick={() => console.log("clicked")} />
      </Tooltip>
      <Tooltip content="Home">
        <IconButton label="Home" iconSrc={HomeIC} onClick={() => console.log("clicked")} />
      </Tooltip>
      <Tooltip content="Home" side="left">
        <IconButton label="Home" iconSrc={HomeIC} onClick={() => console.log("clicked")} />
      </Tooltip>
      <Tooltip content="Home" side="right" open={true}>
        <IconButton label="Home" iconSrc={HomeIC} onClick={() => console.log("clicked")} />
      </Tooltip>
    </div>
  );
}
