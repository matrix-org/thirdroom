import { IconButton } from "../../src/ui/atoms/button/IconButton";
import HomeIC from "../../res/ic/home.svg";

export function IconButtonStores() {
  return (
    <div className="flex">
      <div>
        <IconButton label="Home" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton label="Home" variant="primary" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton label="Home" variant="positive" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton label="Home" variant="danger" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
      </div>
      <div>
        <IconButton size="small" label="Home" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton size="small" label="Home" variant="primary" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton size="small" label="Home" variant="positive" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
        <IconButton size="small" label="Home" variant="danger" iconSrc={HomeIC} onClick={(a) => alert("clicked")} />
      </div>
    </div>
  );
}
