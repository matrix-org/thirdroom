import { useCallback, useState, FormEvent, ChangeEvent } from "react";
import { RoomVisibility, IBlobHandle, RoomType } from "@thirdroom/hydrogen-view-sdk";
import { useNavigate } from "react-router-dom";

import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";
import { Button } from "../../../atoms/button/Button";
import { IconButton } from "../../../atoms/button/IconButton";
import { Switch } from "../../../atoms/button/Switch";
import { Label } from "../../../atoms/text/Label";
import { Input } from "../../../atoms/input/Input";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Window } from "../../components/window/Window";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { WindowContent } from "../../components/window/WindowContent";
import { WindowAside } from "../../components/window/WindowAside";
import LanguageIC from "../../../../../res/ic/language.svg";
import { getMxIdDomain, isRoomAliasAvailable } from "../../../utils/matrixUtils";
import { getImageDimension } from "../../../utils/common";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useStore } from "../../../hooks/useStore";
import { useDebounce } from "../../../hooks/useDebounce";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { Footer } from "../../../atoms/footer/Footer";
import { Content } from "../../../atoms/content/Content";
import CrossCircleIC from "../../../../../res/ic/cross-circle.svg";
import { SceneUpload } from "./SceneUpload";
import "./CreateWorld.css";
import { ScenePreviewUpload } from "./ScenePreviewUpload";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import { AvatarPicker } from "../../components/avatar-picker/AvatarPicker";
import { useFilePicker } from "../../../hooks/useFilePicker";

export interface CreateWorldOptions {
  avatar?: IBlobHandle;
  sceneMxc: string;
  scenePrevMxc: string;
  name: string;
  topic?: string;
  visibility: RoomVisibility;
  alias?: string;
}

export function CreateWorld() {
  const { session, platform } = useHydrogen(true);
  const { homeserver } = session.sessionInfo;
  const userHSDomain = getMxIdDomain(session.userId);
  const { closeWindow } = useStore((state) => state.overlayWindow);

  const { fileData: avatarData, pickFile: pickAvatar, dropFile: dropAvatar } = useFilePicker(platform, "image/*");
  const [sceneMxc, setSceneMxc] = useState<string>();
  const [scenePrevMxc, setScenePrevMxc] = useState<string>();
  const [scenePrevBlob, setScenePrevBlob] = useState<IBlobHandle>();
  const [isAliasAvail, setAliasAvail] = useState<boolean>();
  const isMounted = useIsMounted();
  const [creatingRoom, setCreatingRoom] = useState(false);

  const navigate = useNavigate();

  const handleCreateWorld = useCallback(
    async ({ avatar, name, sceneMxc, scenePrevMxc, topic, visibility, alias }: CreateWorldOptions) => {
      setCreatingRoom(true);

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
          state_default: 0,
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
            "org.matrix.msc3401.call.member": 0,
            "org.matrix.msc3815.member.world": 0,
          },
          users: {
            [session.userId]: 100,
          },
        },
        initialState: [
          {
            type: "m.world",
            content: {
              scene_url: sceneMxc,
              scene_preview_url: scenePrevMxc,
            },
          },
        ],
      });

      navigate(`/world/${roomBeingCreated.id}`);

      selectWindow();
    },
    [session, navigate, selectWindow]
  );

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (isAliasAvail === false || !sceneMxc || !scenePrevMxc) return;
    const { nameInput, topicInput, isPrivateInput, aliasInput } = evt.target as typeof evt.target & {
      nameInput: HTMLInputElement;
      topicInput: HTMLInputElement;
      isPrivateInput: HTMLInputElement;
      aliasInput: HTMLInputElement;
    };
    handleCreateWorld({
      visibility: isPrivateInput.checked ? RoomVisibility.Private : RoomVisibility.Public,
      name: nameInput.value,
      sceneMxc,
      scenePrevMxc,
      topic: topicInput.value || undefined,
      avatar: avatarData.blob,
      alias: aliasInput.value || undefined,
    });
  };

  const debouncedAliasChange = useCallback(
    async (evt: ChangeEvent<HTMLInputElement>) => {
      if (!isMounted) return;
      setAliasAvail(undefined);
      if (evt.target.value.trim() === "") return;

      const value = evt.target.value.replace(/\s/g, "-");
      if (evt.target.value !== value) evt.target.value = value;
      const isAvail = await isRoomAliasAvailable(homeserver, `#${value}:${userHSDomain}`);

      if (evt.target.value !== value) return;
      if (!isMounted) return;
      setAliasAvail(isAvail);
    },
    [homeserver, userHSDomain, isMounted]
  );

  const handleAliasChange = useDebounce(debouncedAliasChange, { wait: 300, immediate: true });

  return (
    <Window>
      <Content
        onSubmit={handleSubmit}
        top={
          <Header
            left={
              <HeaderTitle icon={<Icon className="shrink-0" src={LanguageIC} color="surface" />}>
                Create World
              </HeaderTitle>
            }
            right={<IconButton onClick={() => closeWindow()} iconSrc={CrossCircleIC} label="Close" />}
          />
        }
      >
        <WindowContent
          children={
            <Content
              children={
                <Scroll>
                  <div className="CreateWorld__content">
                    <SettingTile label={<Label>World Avatar</Label>}>
                      <AvatarPicker url={avatarData.url} onAvatarPick={pickAvatar} onAvatarDrop={dropAvatar} />
                    </SettingTile>
                    <div className="flex gap-lg">
                      <SceneUpload onMxcChange={setSceneMxc} />
                      <ScenePreviewUpload onMxcChange={setScenePrevMxc} onBlobChange={setScenePrevBlob} />
                    </div>
                    <div className="flex gap-lg">
                      <SettingTile className="grow basis-0" label={<Label>World Name *</Label>}>
                        <Input name="nameInput" required />
                      </SettingTile>
                      <SettingTile className="grow basis-0" label={<Label>Topic</Label>}>
                        <Input name="topicInput" />
                      </SettingTile>
                    </div>
                    <div className="flex gap-lg">
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
                      <SettingTile className="grow basis-0" label={<Label>Private</Label>}>
                        <Switch name="isPrivateInput" defaultChecked={true} />
                      </SettingTile>
                    </div>
                  </div>
                </Scroll>
              }
              bottom={
                <Footer
                  left={
                    <Button size="lg" fill="outline" onClick={() => closeWindow()}>
                      Cancel
                    </Button>
                  }
                  right={
                    <Button
                      size="lg"
                      type="submit"
                      disabled={isAliasAvail === false || !sceneMxc || !scenePrevMxc || creatingRoom}
                    >
                      {creatingRoom ? "Creating World..." : "Create World"}
                    </Button>
                  }
                />
              }
            />
          }
          aside={
            <WindowAside className="flex">
              <ScenePreview
                className="grow"
                src={scenePrevBlob ? URL.createObjectURL(scenePrevBlob.nativeBlob) : undefined}
                fallback={
                  <Text variant="b3" color="surface-low" weight="medium">
                    Your uploaded scene preview will appear here.
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
