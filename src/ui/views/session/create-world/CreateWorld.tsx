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
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import { ThumbnailHover } from "../../../atoms/thumbnail/ThumbnailHover";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Window } from "../../components/window/Window";
import { WindowHeader } from "../../components/window/WindowHeader";
import { WindowHeaderTitle } from "../../components/window/WindowHeaderTitle";
import { WindowContent } from "../../components/window/WindowContent";
import LanguageIC from "../../../../../res/ic/language.svg";
import { getMxIdDomain, isRoomAliasAvailable } from "../../../utils/matrixUtils";
import { getImageDimension } from "../../../utils/common";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useStore } from "../../../hooks/useStore";
import AddIC from "../../../../../res/ic/add.svg";
import CrossCircleIC from "../../../../../res/ic/cross-circle.svg";
import "./CreateWorld.css";
import { useDebounce } from "../../../hooks/useDebounce";
import { useIsMounted } from "../../../hooks/useIsMounted";

export interface CreateWorldOptions {
  avatar?: IBlobHandle;
  name: string;
  topic?: string;
  visibility: RoomVisibility;
  alias?: string;
}

export function CreateWorld() {
  const { session, platform } = useHydrogen(true);
  const { homeserver } = session._sessionInfo;
  const userHSDomain = getMxIdDomain(session.userId);
  const selectWindow = useStore((state) => state.overlayWindow.selectWindow);

  const [avatarBlob, setAvatarBlob] = useState<IBlobHandle>();
  const [isAliasAvail, setAliasAvail] = useState<boolean>();
  const isMounted = useIsMounted();

  const navigate = useNavigate();

  const handleCreateWorld = useCallback(
    async ({ avatar, name, topic, visibility, alias }: CreateWorldOptions) => {
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
        isFederationDisabled: true,
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
          },
          users: {
            [session.userId]: 100,
          },
        },
      });

      navigate(`/world/${roomBeingCreated.id}`);
    },
    [session, navigate]
  );

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (isAliasAvail === false) return;
    const { nameInput, topicInput, isPrivateInput, aliasInput } = evt.target as typeof evt.target & {
      nameInput: HTMLInputElement;
      topicInput: HTMLInputElement;
      isPrivateInput: HTMLInputElement;
      aliasInput: HTMLInputElement;
    };
    handleCreateWorld({
      visibility: isPrivateInput.checked ? RoomVisibility.Private : RoomVisibility.Public,
      name: nameInput.value,
      topic: topicInput.value || undefined,
      avatar: !avatarBlob ? undefined : avatarBlob,
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
    <Window
      className="grow"
      header={
        <WindowHeader
          left={
            <WindowHeaderTitle icon={<Icon className="shrink-0" src={LanguageIC} color="surface" />}>
              Create World
            </WindowHeaderTitle>
          }
          right={<IconButton onClick={() => selectWindow()} iconSrc={CrossCircleIC} label="Close" />}
        />
      }
    >
      <WindowContent aside=" ">
        <Scroll>
          <form className="CreateWorld__content" onSubmit={handleSubmit}>
            <SettingTile label={<Label>World Avatar</Label>}>
              <ThumbnailHover
                content={
                  !avatarBlob ? undefined : (
                    <IconButton
                      variant="world"
                      onClick={() => {
                        setAvatarBlob(undefined);
                      }}
                      size="xl"
                      iconSrc={CrossCircleIC}
                      label="Remove world avatar"
                    />
                  )
                }
              >
                <Thumbnail size="sm" className="flex">
                  {avatarBlob ? (
                    <ThumbnailImg src={URL.createObjectURL(avatarBlob.nativeBlob)} />
                  ) : (
                    <IconButton
                      onClick={async () => {
                        const data = await platform.openFile("image/*");
                        if (!data) return;
                        setAvatarBlob(data.blob);
                      }}
                      size="xl"
                      iconSrc={AddIC}
                      label="Add world avatar"
                    />
                  )}
                </Thumbnail>
              </ThumbnailHover>
            </SettingTile>
            <div className="flex gap-lg">
              <SettingTile className="grow basis-0" label={<Label>World Name *</Label>}>
                <Input name="nameInput" required />
              </SettingTile>
              <SettingTile className="grow basis-0" label={<Label>Private</Label>}>
                <Switch name="isPrivateInput" defaultChecked={true} />
              </SettingTile>
            </div>
            <div className="flex gap-lg">
              <SettingTile className="grow basis-0" label={<Label>Topic</Label>}>
                <Input name="topicInput" />
              </SettingTile>
              <SettingTile
                className="grow basis-0"
                label={
                  <Label color={isAliasAvail ? "secondary" : isAliasAvail === false ? "danger" : undefined}>
                    {isAliasAvail ? "Alias (Available)" : isAliasAvail === false ? "Alias (Already in use)" : "Alias"}
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
            </div>
            <div className="flex gap-md">
              <Button fill="outline" onClick={() => selectWindow()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAliasAvail === false}>
                Create World
              </Button>
            </div>
          </form>
        </Scroll>
      </WindowContent>
    </Window>
  );
}
