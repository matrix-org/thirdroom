import { useEffect, useState, useCallback, KeyboardEventHandler, FocusEventHandler } from "react";
import { useSetAtom } from "jotai";
import { Platform, Room, Session } from "@thirdroom/hydrogen-view-sdk";

import { IconButton } from "../../../atoms/button/IconButton";
import { Content } from "../../../atoms/content/Content";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { Window } from "../../components/window/Window";
import CrossIC from "../../../../../res/ic/cross.svg";
import { WindowContent } from "../../components/window/WindowContent";
import { WindowAside } from "../../components/window/WindowAside";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Button } from "../../../atoms/button/Button";
import { Text } from "../../../atoms/text/Text";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Label } from "../../../atoms/text/Label";
import { AvatarPicker } from "../../components/avatar-picker/AvatarPicker";
import { useFilePicker } from "../../../hooks/useFilePicker";
import { useHydrogen } from "../../../hooks/useHydrogen";
import "./WorldSettings.css";
import { getAvatarHttpUrl, getHttpUrl } from "../../../utils/avatar";
import { Input } from "../../../atoms/input/Input";
import { Switch } from "../../../atoms/button/Switch";
import UploadIC from "../../../../../res/ic/upload.svg";
import { Icon } from "../../../atoms/icon/Icon";
import { AutoFileUpload, AutoUploadInfo } from "../../components/AutoFileUpload";
import { uploadAttachment } from "../../../utils/matrixUtils";
import { MAX_OBJECT_CAP } from "../../../../engine/config.common";
import { OverlayWindow, overlayWindowAtom } from "../../../state/overlayWindow";
import { usePowerLevels } from "../../../hooks/usePowerLevels";
import { useStateEventKeyCallback } from "../../../hooks/useStateEventKeyCallback";
import { NumericInput } from "../../../atoms/input/NumericInput";
import { EmptyState } from "../../components/empty-state/EmptyState";

function WorldAvatarSetting({ room, session, platform }: { room: Room; session: Session; platform: Platform }) {
  const currentAvatarUrl = room?.avatarUrl
    ? getAvatarHttpUrl(room.avatarUrl, 150, platform, session.mediaRepository) ?? undefined
    : undefined;

  const { fileData: avatarData, pickFile: pickAvatar, dropFile: dropAvatar } = useFilePicker(platform, "image/*");

  const isAvatarChanged = (currentAvatarUrl || avatarData.blob) && (avatarData.dropUsed > 0 || avatarData.pickUsed > 0);
  const avatarUrl = isAvatarChanged ? avatarData.url : currentAvatarUrl;

  useEffect(() => {
    if (isAvatarChanged) {
      (async () => {
        let mxc = "";
        if (avatarData.blob) {
          mxc = (await uploadAttachment(session.hsApi, avatarData.blob)) ?? "";
        }
        session.hsApi.sendState(room.id, "m.room.avatar", "", {
          url: mxc,
        });
      })();
    }
  }, [isAvatarChanged, avatarData.blob, session, room.id]);

  return (
    <SettingTile label={<Label>World Avatar</Label>}>
      <AvatarPicker url={avatarUrl} onAvatarPick={pickAvatar} onAvatarDrop={dropAvatar} />
    </SettingTile>
  );
}

function WorldNameSetting({ room, session }: { room: Room; session: Session }) {
  const initialName = room.name ?? "Unknown";

  const submit = (name: string) => {
    if (name === room.name || name.trim() === "") return;
    session.hsApi.sendState(room.id, "m.room.name", "", { name });
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      submit(evt.currentTarget.value.trim());
    }
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (evt) => {
    submit(evt.currentTarget.value.trim());
  };

  return (
    <SettingTile className="grow basis-0" label={<Label>World Name *</Label>}>
      <Input onKeyDown={handleKeyDown} onBlur={handleBlur} defaultValue={initialName} required />
    </SettingTile>
  );
}

function WorldJoinRuleSetting({ room, session }: { room: Room; session: Session }) {
  const [isPrivate, setIsPrivate] = useState(true);

  useStateEventKeyCallback(
    room,
    "m.room.join_rules",
    "",
    useCallback((event) => {
      console.log(event);
      const isPvt: boolean = event?.content.join_rule !== "public";
      setIsPrivate(isPvt);
    }, [])
  );

  const handleChange = (isPvt: boolean) => {
    setIsPrivate(isPvt);
    session.hsApi.sendState(room.id, "m.room.join_rules", "", {
      join_rule: isPvt ? "invite" : "public",
    });
  };

  return (
    <SettingTile className="grow basis-0" label={<Label>Private</Label>}>
      <Switch checked={isPrivate} onCheckedChange={handleChange} />
    </SettingTile>
  );
}

function WorldSceneSetting({ room, session }: { room: Room; session: Session }) {
  const handleSceneUpload = useCallback(
    (info: AutoUploadInfo) => {
      if (!info.mxc) return;
      room.getStateEvent("org.matrix.msc3815.world").then((event) => {
        const content = event?.event?.content ?? {};
        session.hsApi.sendState(room.id, "org.matrix.msc3815.world", "", {
          ...content,
          scene_url: info.mxc,
        });
      });
    },
    [session, room]
  );

  return (
    <SettingTile className="grow basis-0" label={<Label>Scene</Label>}>
      <AutoFileUpload
        mimeType=".glb"
        onUploadInfo={handleSceneUpload}
        renderButton={(pickFile) => (
          <Button fill="outline" onClick={pickFile}>
            <Icon src={UploadIC} color="primary" />
            Change Scene
          </Button>
        )}
      />
    </SettingTile>
  );
}

function WorldScenePrevSetting({ room, session }: { room: Room; session: Session }) {
  const handleScenePrevUpload = useCallback(
    (info: AutoUploadInfo) => {
      if (!info.mxc) return;
      room.getStateEvent("org.matrix.msc3815.world").then((event) => {
        const content = event?.event?.content ?? {};
        session.hsApi.sendState(room.id, "org.matrix.msc3815.world", "", {
          ...content,
          scene_preview_url: info.mxc,
        });
      });
    },
    [session, room]
  );

  return (
    <SettingTile className="grow basis-0" label={<Label>Scene Preview</Label>}>
      <AutoFileUpload
        mimeType="image/*"
        onUploadInfo={handleScenePrevUpload}
        renderButton={(pickFile) => (
          <Button fill="outline" onClick={pickFile}>
            <Icon src={UploadIC} color="primary" />
            Change Preview
          </Button>
        )}
      />
    </SettingTile>
  );
}

function WorldMaxObjCapSetting({ room, session }: { room: Room; session: Session }) {
  const [maxCap, setMaxCap] = useState(MAX_OBJECT_CAP);

  useStateEventKeyCallback(
    room,
    "org.matrix.msc3815.world",
    "",
    useCallback((evt) => {
      const cap: number | undefined = evt?.content.max_member_object_cap;
      if (typeof cap === "number") setMaxCap(cap);
    }, [])
  );

  const submit = (cap: number) => {
    if (typeof cap !== "number") return;
    setMaxCap(cap);
    room.getStateEvent("org.matrix.msc3815.world").then((event) => {
      const content = event?.event?.content ?? {};
      session.hsApi.sendState(room.id, "org.matrix.msc3815.world", "", {
        ...content,
        max_member_object_cap: cap,
      });
    });
  };

  return (
    <SettingTile className="grow basis-0" label={<Label>Max Spawned Objects Per User</Label>}>
      <NumericInput value={maxCap} onChange={submit} required />
    </SettingTile>
  );
}

function WorldScriptSetting({ room, session }: { room: Room; session: Session }) {
  const handleScriptUpload = useCallback(
    (info: AutoUploadInfo) => {
      if (!info.mxc) return;
      room.getStateEvent("org.matrix.msc3815.world").then((event) => {
        const content = event?.event?.content ?? {};
        session.hsApi.sendState(room.id, "org.matrix.msc3815.world", "", {
          ...content,
          script_url: info.mxc,
        });
      });
    },
    [session, room]
  );

  return (
    <SettingTile className="grow basis-0" label={<Label>Script (EXPERIMENTAL)</Label>}>
      <AutoFileUpload
        mimeType=".js,.wasm"
        onUploadInfo={handleScriptUpload}
        renderButton={(pickFile) => (
          <Button fill="outline" onClick={pickFile}>
            <Icon src={UploadIC} color="primary" />
            Change Script
          </Button>
        )}
      />
    </SettingTile>
  );
}

interface WorldSettingsProps {
  room: Room;
}

export function WorldSettings({ room }: WorldSettingsProps) {
  const { session, platform } = useHydrogen(true);

  const setOverlayWindow = useSetAtom(overlayWindowAtom);
  const { getPowerLevel, canSendStateEvent } = usePowerLevels(room);
  const myPowerLevel = getPowerLevel(session.userId);

  return (
    <Window onRequestClose={() => setOverlayWindow({ type: OverlayWindow.None })}>
      <Content
        top={
          <Header
            left={<HeaderTitle>World Settings</HeaderTitle>}
            right={
              <IconButton
                onClick={() => setOverlayWindow({ type: OverlayWindow.None })}
                label="Close"
                iconSrc={CrossIC}
              />
            }
          />
        }
      >
        <WindowContent
          children={
            <Content
              children={
                <Scroll>
                  <div className="WorldSettings__content">
                    {canSendStateEvent("m.room.avatar", myPowerLevel) && (
                      <div className="flex gap-lg">
                        <WorldAvatarSetting session={session} platform={platform} room={room} />
                      </div>
                    )}
                    {(canSendStateEvent("m.room.name", myPowerLevel) ||
                      canSendStateEvent("m.room.join_rules", myPowerLevel)) && (
                      <div className="flex gap-lg">
                        {canSendStateEvent("m.room.name", myPowerLevel) && (
                          <WorldNameSetting room={room} session={session} />
                        )}
                        {canSendStateEvent("m.room.join_rules", myPowerLevel) && (
                          <WorldJoinRuleSetting room={room} session={session} />
                        )}
                      </div>
                    )}
                    {canSendStateEvent("org.matrix.msc3815.world", myPowerLevel) && (
                      <div className="flex gap-lg">
                        <WorldSceneSetting room={room} session={session} />
                        <WorldScenePrevSetting room={room} session={session} />
                      </div>
                    )}
                    {canSendStateEvent("org.matrix.msc3815.world", myPowerLevel) && (
                      <div className="flex gap-lg">
                        <WorldMaxObjCapSetting room={room} session={session} />
                      </div>
                    )}
                    {canSendStateEvent("org.matrix.msc3815.world", myPowerLevel) && (
                      <div className="flex gap-lg">
                        <WorldScriptSetting room={room} session={session} />
                      </div>
                    )}
                    <EmptyState
                      className="WorldSettings__empty-state"
                      heading="Permission Required"
                      text="You do not have sufficient permissions to change any of the settings."
                    />
                  </div>
                </Scroll>
              }
            />
          }
          aside={
            <WindowAside className="flex">
              <WorldScenePreview room={room} session={session} />
            </WindowAside>
          }
        />
      </Content>
    </Window>
  );
}

function WorldScenePreview({ room, session }: { room: Room; session: Session }) {
  const [prevMxc, setPreviewMxc] = useState<string>();
  useStateEventKeyCallback(
    room,
    "org.matrix.msc3815.world",
    "",
    useCallback((evt) => {
      const mxc: string | undefined = evt?.content.scene_preview_url;
      if (typeof mxc === "string") setPreviewMxc(mxc);
    }, [])
  );

  return (
    <ScenePreview
      className="grow"
      src={getHttpUrl(session, prevMxc)}
      alt="Scene Preview"
      fallback={
        <Text variant="b3" color="surface-low" weight="medium">
          Your uploaded scene preview will appear here.
        </Text>
      }
    />
  );
}
