import { Window } from "./Window";
import { WindowHeader } from "./WindowHeader";
import { WindowHeaderTitle } from "./WindowHeaderTitle";
import { WindowContent } from "./WindowContent";
import { WindowFooter } from "./WindowFooter";
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
      <Window
        header={
          <WindowHeader
            left={
              <WindowHeaderTitle icon={<Icon className="shrink-0" src={ExploreIC} color="surface" />}>
                Discover
              </WindowHeaderTitle>
            }
            right={<IconButton label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => console.log("clicked")} />}
          />
        }
        footer={
          <WindowFooter
            left={
              <Button fill="outline" onClick={() => console.log("click")}>
                Cancel
              </Button>
            }
            right={<Button onClick={() => console.log("click")}>Create World</Button>}
          />
        }
      >
        <WindowContent aside="Right panel" header="Content header" footer="Content footer">
          Content
        </WindowContent>
      </Window>
    </div>
  );
}
