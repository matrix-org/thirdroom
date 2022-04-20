import { Icon } from "./Icon";
import HomeIC from "../../../../res/ic/home.svg";

export const title = "Icon";

export default function IconStories() {
  return (
    <div className="flex">
      <Icon color="red" src={HomeIC} />
      <Icon color="blue" src={HomeIC} />
      <Icon size="sm" src={HomeIC} />
      <Icon color="green" size="sm" src={HomeIC} />
      <Icon size="xs" src={HomeIC} />
      <Icon color="green" size="xs" src={HomeIC} />
    </div>
  );
}
