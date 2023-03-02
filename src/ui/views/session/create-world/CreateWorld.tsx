import { useState } from "react";
import { useSetAtom } from "jotai";

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
import { Content } from "../../../atoms/content/Content";
import CrossIC from "../../../../../res/ic/cross.svg";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import { getHttpUrl } from "../../../utils/avatar";
import { CreateWorldForm } from "./CreateWorldForm";
import { overlayWorldAtom } from "../../../state/overlayWorld";
import { OverlayWindow, overlayWindowAtom } from "../../../state/overlayWindow";

export function CreateWorld() {
  const { session } = useHydrogen(true);
  const setOverlayWindow = useSetAtom(overlayWindowAtom);

  const selectWorld = useSetAtom(overlayWorldAtom);
  const [scenePreviewUrl, setScenePreviewUrl] = useState<string>();

  const handleOnCreate = (roomId: string) => {
    selectWorld(roomId);
    setOverlayWindow({ type: OverlayWindow.None });
  };

  return (
    <Window onRequestClose={() => setOverlayWindow({ type: OverlayWindow.None })}>
      <Content
        top={
          <Header
            left={
              <HeaderTitle icon={<Icon className="shrink-0" src={LanguageIC} color="surface" />}>
                Create World
              </HeaderTitle>
            }
            right={
              <IconButton
                onClick={() => setOverlayWindow({ type: OverlayWindow.None })}
                iconSrc={CrossIC}
                label="Close"
              />
            }
          />
        }
      >
        <WindowContent
          children={
            <CreateWorldForm
              onSceneChange={(sceneUrl, previewUrl) => setScenePreviewUrl(previewUrl)}
              onCreate={handleOnCreate}
              onClose={() => setOverlayWindow({ type: OverlayWindow.None })}
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
