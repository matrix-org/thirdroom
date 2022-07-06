import { IconButton } from "../../../atoms/button/IconButton";
import { Content } from "../../../atoms/content/Content";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { Window } from "../../components/window/Window";
import CrossCircleIC from "../../../../../res/ic/cross-circle.svg";
import { WindowContent } from "../../components/window/WindowContent";
import { WindowAside } from "../../components/window/WindowAside";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";

interface WorldSettingsProps {
  roomId: string;
}

export function WorldSettings({ roomId }: WorldSettingsProps) {
  return (
    <Window>
      <Content
        top={
          <Header
            left={<HeaderTitle>World Settings</HeaderTitle>}
            right={<IconButton onClick={() => console.log("close")} label="Close" iconSrc={CrossCircleIC} />}
          />
        }
      >
        <WindowContent
          children={<div>Hello, World!</div>}
          aside={
            <WindowAside>
              <ScenePreview />
            </WindowAside>
          }
        />
      </Content>
    </Window>
  );
}
