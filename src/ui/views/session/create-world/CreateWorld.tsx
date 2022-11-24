import { useState } from "react";
import { RoomVisibility, IBlobHandle, RoomType, Session } from "@thirdroom/hydrogen-view-sdk";

import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";
import { IconButton } from "../../../atoms/button/IconButton";
import { Window } from "../../components/window/Window";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { WindowContent } from "../../components/window/WindowContent";
import { WindowAside } from "../../components/window/WindowAside";
import LanguageIC from "../../../../../res/ic/language.svg";
import { getImageDimension } from "../../../utils/common";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useStore } from "../../../hooks/useStore";
import { Content } from "../../../atoms/content/Content";
import CrossIC from "../../../../../res/ic/cross.svg";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import { getHttpUrl } from "../../../utils/avatar";
import { CreateWorldForm } from "./CreateWorldForm";

export interface CreateWorldOptions {
  avatar?: IBlobHandle;
  name: string;
  topic?: string;
  visibility: RoomVisibility;
  alias?: string;
  content: {
    scene_url: string;
    scene_preview_url: string;
    max_member_object_cap?: number;
  } & Record<string, any>;
}

export async function createWorld(
  session: Session,
  { avatar, name, topic, visibility, alias, content }: CreateWorldOptions
) {
  const avatarInfo = !avatar
    ? undefined
    : {
        name: avatar.nativeBlob.name,
        blob: avatar,
        info: {
          mimetype: avatar.nativeBlob.type,
          size: avatar.size,
          ...(await getImageDimension(avatar.nativeBlob)),
        },
      };

  const roomBeingCreated = await session.createRoom({
    type: RoomType.World,
    visibility,
    avatar: avatarInfo,
    name,
    topic,
    alias,
    isEncrypted: false,
    isFederationDisabled: false,
    powerLevelContentOverride: {
      invite: 100,
      kick: 100,
      ban: 100,
      redact: 50,
      state_default: 50,
      events_default: 0,
      users_default: 0,
      events: {
        "m.room.power_levels": 100,
        "m.room.history_visibility": 100,
        "m.room.tombstone": 100,
        "m.room.encryption": 100,
        "m.room.name": 50,
        "m.room.message": 0,
        "m.room.encrypted": 50,
        "m.sticker": 50,
        "org.matrix.msc3815.world": 50,
        "org.matrix.msc3401.call": 0,
        "org.matrix.msc3401.call.member": 0,
        "org.matrix.msc3815.member.world": 0,
      },
      users: {
        [session.userId]: 100,
      },
    },
    initialState: [
      {
        type: "org.matrix.msc3815.world",
        content,
      },
    ],
  });

  return roomBeingCreated;
}

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
