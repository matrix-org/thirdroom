import { IconButton } from "./IconButton";
import HomeIC from "../../../../res/ic/home.svg";

export const title = "IconButton";

export default function IconButtonStories() {
  return (
    <div className="flex">
      <div>
        <IconButton label="Home" size="xl" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
      </div>
      <div>
        <IconButton label="Home" size="lg" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
      </div>
      <div>
        <IconButton label="Home" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
        <IconButton label="Home" variant="surface-low" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
        <IconButton label="Home" variant="world" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
        <IconButton label="Home" variant="primary" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
        <IconButton label="Home" variant="secondary" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
        <IconButton label="Home" variant="danger" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
        <IconButton disabled label="Home" variant="danger" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
      </div>
      <div>
        <IconButton size="sm" label="Home" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
        <IconButton
          size="sm"
          label="Home"
          variant="surface-low"
          iconSrc={HomeIC}
          onClick={(a) => console.log("clicked")}
        />
        <IconButton size="sm" label="Home" variant="world" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
        <IconButton size="sm" label="Home" variant="primary" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
        <IconButton
          size="sm"
          label="Home"
          variant="secondary"
          iconSrc={HomeIC}
          onClick={(a) => console.log("clicked")}
        />
        <IconButton size="sm" label="Home" variant="danger" iconSrc={HomeIC} onClick={(a) => console.log("clicked")} />
      </div>
    </div>
  );
}
