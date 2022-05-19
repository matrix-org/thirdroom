import { Window } from "./Window";
import { WindowHeader } from "./WindowHeader";
import { WindowHeaderTitle } from "./WindowHeaderTitle";
import { WindowContent } from "./WindowContent";
import { WindowAside } from "./WindowAside";
import { WindowFooter } from "./WindowFooter";
import { Content } from "../../../atoms/content/Content";
import { Icon } from "../../../atoms/icon/Icon";
import { IconButton } from "../../../atoms/button/IconButton";
import MoreHorizontalIC from "../../../../../res/ic/more-horizontal.svg";
import ExploreIC from "../../../../../res/ic/explore.svg";
import "./Window.css";
import { Button } from "../../../atoms/button/Button";

export const title = "Window";

export default function WindowStories() {
  return (
    <div style={{ height: "500px" }}>
      <Window>
        <Content
          className="grow"
          top={
            <WindowHeader
              left={
                <WindowHeaderTitle icon={<Icon className="shrink-0" src={ExploreIC} color="surface" />}>
                  Discover
                </WindowHeaderTitle>
              }
              right={<IconButton label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => console.log("clicked")} />}
            />
          }
          children={<WindowContent children="Content" aside={<WindowAside>Right panel</WindowAside>} />}
          bottom={
            <WindowFooter
              left={
                <Button fill="outline" onClick={() => console.log("click")}>
                  Cancel
                </Button>
              }
              right={<Button onClick={() => console.log("click")}>Create World</Button>}
            />
          }
        />
      </Window>
    </div>
  );
}
