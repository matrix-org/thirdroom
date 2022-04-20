import { Tooltip } from "./Tooltip";
import { IconButton } from "../button/IconButton";
import HomeIC from "../../../../res/ic/home.svg";

export const title = "Tooltip";

export default function TooltopStories() {
  return (
    <div className="flex">
      <Tooltip content="Home" side="left">
        <IconButton label="Home" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
      </Tooltip>
      <Tooltip content="Home" side="top" open={true}>
        <IconButton label="Home" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
      </Tooltip>
      <Tooltip content="Home">
        <IconButton label="Home" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
      </Tooltip>
      <Tooltip content="Home" side="left">
        <IconButton label="Home" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
      </Tooltip>
      <Tooltip content="Home" side="right">
        <IconButton label="Home" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
      </Tooltip>
    </div>
  );
}
