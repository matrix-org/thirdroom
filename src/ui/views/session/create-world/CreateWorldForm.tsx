import { useCallback, useState, FormEvent, ChangeEvent, ReactNode, useEffect } from "react";
import { RoomVisibility, IBlobHandle, RoomType, Session, StateEvent } from "@thirdroom/hydrogen-view-sdk";

import { Text } from "../../../atoms/text/Text";
import { Button } from "../../../atoms/button/Button";
import { Switch } from "../../../atoms/button/Switch";
import { Label } from "../../../atoms/text/Label";
import { Input } from "../../../atoms/input/Input";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { getMxIdDomain, isRoomAliasAvailable, waitToCreateRoom } from "../../../utils/matrixUtils";
import { getImageDimension } from "../../../utils/common";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useDebounce } from "../../../hooks/useDebounce";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { Footer } from "../../../atoms/footer/Footer";
import { Content } from "../../../atoms/content/Content";
import { AvatarPicker } from "../../components/avatar-picker/AvatarPicker";
import { useFilePicker } from "../../../hooks/useFilePicker";
import defaultWorlds from "../../../../../res/defaultWorlds.json";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import { getHttpUrl } from "../../../utils/avatar";
import { UploadScene } from "./UploadScene";
import { MAX_OBJECT_CAP } from "../../../../engine/config.common";
import "./CreateWorldForm.css";

export function AliasAvailabilityProvider({
  session,
  children,
}: {
  session: Session;
  children: (
    available: boolean | undefined,
    handleAliasChange: (evt: ChangeEvent<HTMLInputElement>) => void
  ) => ReactNode;
}) {
  const { homeserver } = session.sessionInfo;
  const userHSDomain = getMxIdDomain(session.userId);
  const isMounted = useIsMounted();
  const [available, setAvailable] = useState<boolean>();

  const debouncedAliasChange = useCallback(
    async (evt: ChangeEvent<HTMLInputElement>) => {
      if (!isMounted()) return;
      setAvailable(undefined);
      if (evt.target.value.trim() === "") return;

      const value = evt.target.value.replace(/\s/g, "-");
      if (evt.target.value !== value) evt.target.value = value;
      const isAvail = await isRoomAliasAvailable(homeserver, `#${value}:${userHSDomain}`);

      if (evt.target.value !== value) return;
      if (!isMounted()) return;
      setAvailable(isAvail);
    },
    [homeserver, userHSDomain, isMounted]
  );

  const handleAliasChange = useDebounce(debouncedAliasChange, { wait: 300, immediate: true });
  return <>{children(available, handleAliasChange)}</>;
}

export type CreateWorldContent = {
  scene_url: string;
  scene_preview_url: string;
  max_member_object_cap?: number;
} & Record<string, any>;
export interface CreateWorldOptions {
  avatar?: IBlobHandle;
  name: string;
  topic?: string;
  visibility: RoomVisibility;
  alias?: string;
  content: CreateWorldContent;
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

export interface CreateWorldFormProps {
  scene?: {
    roomId: string;
    event: StateEvent;
  };
  onSceneChange?: (sceneUrl?: string, scenePreviewUrl?: string) => void;
  onCreate: (roomId: string) => void;
  onClose: () => void;
}
export function CreateWorldForm({ scene, onSceneChange, onCreate, onClose }: CreateWorldFormProps) {
  const { session, platform } = useHydrogen(true);
  const userHSDomain = getMxIdDomain(session.userId);
  const isMounted = useIsMounted();

  const { fileData: avatarData, pickFile: pickAvatar, dropFile: dropAvatar } = useFilePicker(platform, "image/*");

  const eventSceneUrl = scene?.event?.content.scene.url;
  const eventPreviewUrl = scene?.event?.content.scene.preview_url;
  const controlledScene =
    typeof eventSceneUrl === "string" && typeof eventPreviewUrl === "string"
      ? {
          url: eventSceneUrl,
          previewUrl: eventPreviewUrl,
        }
      : undefined;

  const [uploadScene, setUploadScene] = useState<{ url: string; previewUrl: string } | undefined>(controlledScene);
  const [selectedScene, setSelectedScene] = useState<{ url: string; previewUrl: string } | undefined>(controlledScene);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const handleCreateWorld = async (options: CreateWorldOptions) => {
    setCreatingRoom(true);
    const roomBeingCreated = await createWorld(session, options);
    const room = await waitToCreateRoom(session, roomBeingCreated);
    if (room && isMounted()) {
      onCreate(room.id);
      setCreatingRoom(false);
    }
  };

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (!selectedScene) return;
    const { nameInput, topicInput, isPrivateInput, aliasInput, maxObjectCapInput } = evt.target as typeof evt.target & {
      nameInput: HTMLInputElement;
      topicInput: HTMLInputElement;
      isPrivateInput: HTMLInputElement;
      aliasInput: HTMLInputElement;
      maxObjectCapInput: HTMLInputElement;
    };
    const alias = aliasInput.getAttribute("data-ui-state") === "error" ? undefined : aliasInput.value || undefined;
    const content: CreateWorldContent = {
      scene_url: selectedScene.url,
      scene_preview_url: selectedScene.previewUrl,
      max_member_object_cap: parseInt(maxObjectCapInput.value) || undefined,
    };
    if (controlledScene && scene) {
      content.scene = scene.event.content.scene;
      content.scene_from = {
        state_key: scene.event.state_key ?? undefined,
        room_id: scene.roomId,
      };
    }
    handleCreateWorld({
      visibility: isPrivateInput.checked ? RoomVisibility.Private : RoomVisibility.Public,
      name: nameInput.value,
      topic: topicInput.value || undefined,
      avatar: avatarData.blob,
      alias,
      content,
    });
  };

  useEffect(() => {
    onSceneChange?.(selectedScene?.url, selectedScene?.previewUrl);
  }, [selectedScene, onSceneChange]);

  const renderSceneSelector = (sceneUrl: string, previewUrl: string, roomAvatarUrl?: string) => (
    <button
      key={sceneUrl}
      className="flex"
      style={{ cursor: "pointer" }}
      onClick={() => {
        setSelectedScene({ url: sceneUrl, previewUrl });
      }}
      type="button"
    >
      <Thumbnail outlined={selectedScene?.url === sceneUrl} className="shrink-0" size="sm">
        <ThumbnailImg src={getHttpUrl(session, roomAvatarUrl ?? previewUrl)!} />
      </Thumbnail>
    </button>
  );

  return (
    <Content
      onSubmit={handleSubmit}
      children={
        <Scroll>
          <div className="CreateWorldForm">
            {controlledScene ? null : (
              <SettingTile label={<Label>Scenes *</Label>}>
                <Scroll orientation="horizontal" type="hover">
                  <div className="flex items-center gap-md">
                    {uploadScene && renderSceneSelector(uploadScene.url, uploadScene.previewUrl)}
                    <UploadScene
                      onSave={(sceneUrl, previewUrl) => {
                        setUploadScene({ url: sceneUrl, previewUrl });
                        setSelectedScene({ url: sceneUrl, previewUrl });
                      }}
                      renderTrigger={(openModal) => (
                        <AvatarPicker onAvatarPick={openModal} onAvatarDrop={() => false} />
                      )}
                    />
                    <div
                      className="shrink-0"
                      style={{ backgroundColor: "var(--bg-surface-border)", height: "40px", width: "2px" }}
                    />
                    {defaultWorlds.scenes.map((scene) =>
                      renderSceneSelector(scene.sceneUrl, scene.scenePreviewUrl, scene.defaultRoomAvatarUrl)
                    )}
                  </div>
                </Scroll>
              </SettingTile>
            )}
            <div className="flex gap-lg">
              <SettingTile className="grow basis-0" label={<Label>World Name *</Label>}>
                <Input name="nameInput" required />
              </SettingTile>
              <SettingTile className="grow basis-0" label={<Label>Topic</Label>}>
                <Input name="topicInput" />
              </SettingTile>
            </div>
            <div className="flex gap-lg">
              <AliasAvailabilityProvider session={session}>
                {(isAliasAvail, handleAliasChange) => (
                  <SettingTile
                    className="grow basis-0"
                    label={
                      <Label color={isAliasAvail ? "secondary" : isAliasAvail === false ? "danger" : undefined}>
                        {isAliasAvail
                          ? "Alias (Available)"
                          : isAliasAvail === false
                          ? "Alias (Already in use)"
                          : "Alias"}
                      </Label>
                    }
                  >
                    <Input
                      name="aliasInput"
                      state={isAliasAvail ? "success" : isAliasAvail === false ? "error" : undefined}
                      onChange={handleAliasChange}
                      maxLength={255 - (userHSDomain.length + 2) /*for -> #:*/}
                      before={<Text variant="b2">#</Text>}
                      after={<Text variant="b2">{`:${userHSDomain}`}</Text>}
                    />
                  </SettingTile>
                )}
              </AliasAvailabilityProvider>
              <SettingTile className="grow basis-0" label={<Label>Max Spawned Objects Per User</Label>}>
                <Input name="maxObjectCapInput" type="number" defaultValue={MAX_OBJECT_CAP} required />
              </SettingTile>
            </div>
            <SettingTile className="grow basis-0" label={<Label>Private</Label>}>
              <Switch name="isPrivateInput" defaultChecked={true} />
            </SettingTile>
            <SettingTile label={<Label>World Avatar</Label>}>
              <AvatarPicker url={avatarData.url} onAvatarPick={pickAvatar} onAvatarDrop={dropAvatar} />
            </SettingTile>
          </div>
        </Scroll>
      }
      bottom={
        <Footer
          left={
            <Button size="lg" fill="outline" onClick={onClose}>
              Cancel
            </Button>
          }
          right={
            <Button size="lg" type="submit" disabled={!selectedScene || creatingRoom}>
              {creatingRoom ? "Creating World..." : "Create World"}
            </Button>
          }
        />
      }
    />
  );
}
