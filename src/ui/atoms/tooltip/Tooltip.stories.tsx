import { Tooltip } from "./Tooltip";
import { IconButton } from "../button/IconButton";
import HomeIC from "../../../../res/ic/home.svg";

export const title = "Tooltip";

export default function TooltopStories() {
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
