import { IconButton } from "../../src/ui/atoms/button/IconButton";
import HomeIC from "../../res/ic/home.svg";

export function IconButtonStories() {
  return (
    <div className="flex">
      <div>
        <IconButton label="Home" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton label="Home" variant="world" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton label="Home" variant="primary" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton label="Home" variant="secondary" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton label="Home" variant="danger" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
      </div>
      <div>
        <IconButton size="sm" label="Home" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton size="sm" label="Home" variant="world" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton size="sm" label="Home" variant="primary" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton size="sm" label="Home" variant="secondary" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton size="sm" label="Home" variant="danger" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
      </div>
    </div>
  );
}
