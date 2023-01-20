import { useState } from "react";

import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";
import { IconButton } from "../../../atoms/button/IconButton";
import { Window } from "../../components/window/Window";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { WindowContent } from "../../components/window/WindowContent";
import { WindowAside } from "../../components/window/WindowAside";
import LanguageIC from "../../../../../res/ic/language.svg";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useStore } from "../../../hooks/useStore";
import { Content } from "../../../atoms/content/Content";
import CrossIC from "../../../../../res/ic/cross.svg";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import { getHttpUrl } from "../../../utils/avatar";
import { CreateWorldForm } from "./CreateWorldForm";

export function CreateWorld() {
  const { session } = useHydrogen(true);
  const { closeWindow } = useStore((state) => state.overlayWindow);

  const [scenePreviewUrl, setScenePreviewUrl] = useState<string>();

  const handleOnCreate = (roomId: string) => {
    useStore.getState().overlayWorld.selectWorld(roomId);
    closeWindow();
  };

  return (
    <Window onRequestClose={closeWindow}>
      <Content
        top={
          <Header
            left={
              <HeaderTitle icon={<Icon className="shrink-0" src={LanguageIC} color="surface" />}>
                Create World
              </HeaderTitle>
            }
            right={<IconButton onClick={() => closeWindow()} iconSrc={CrossIC} label="Close" />}
          />
        }
      >
        <WindowContent
          children={
            <CreateWorldForm
              onSceneChange={(sceneUrl, previewUrl) => setScenePreviewUrl(previewUrl)}
              onCreate={handleOnCreate}
              onClose={closeWindow}
            />
          }
          aside={
            <WindowAside className="flex">
              <ScenePreview
                className="grow"
                src={getHttpUrl(session, scenePreviewUrl)}
                fallback={
                  <Text variant="b3" color="surface-low" weight="medium">
                    Your scene preview will appear here.
                  </Text>
                }
              />
            </WindowAside>
          }
        />
      </Content>
    </Window>
  );
}
