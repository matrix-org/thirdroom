import { Window } from "./Window";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { WindowContent } from "./WindowContent";
import { WindowAside } from "./WindowAside";
import { Footer } from "../../../atoms/footer/Footer";
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
            <Header
              left={
                <HeaderTitle icon={<Icon className="shrink-0" src={ExploreIC} color="surface" />}>Discover</HeaderTitle>
              }
              right={<IconButton label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => console.log("clicked")} />}
            />
          }
          children={<WindowContent children="Content" aside={<WindowAside>Right panel</WindowAside>} />}
          bottom={
            <Footer
              left={
                <Button size="lg" fill="outline" onClick={() => console.log("click")}>
                  Cancel
                </Button>
              }
              right={
                <Button size="lg" onClick={() => console.log("click")}>
                  Create World
                </Button>
              }
            />
          }
        />
      </Window>
    </div>
  );
}
