import { Icon } from "../../src/ui/atoms/icon/Icon";
import HomeIC from "../../res/ic/home.svg";

export function IconStories() {
  return (
    <div className="flex">
      <Icon color="red" src={HomeIC} />
      <Icon color="blue" src={HomeIC} />
      <Icon size="small" src={HomeIC} />
      <Icon color="green" size="small" src={HomeIC} />
    </div>
  );
}
