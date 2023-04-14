import { ChangeEvent, FormEvent, useEffect, useState, useRef } from "react";
import { Room } from "@thirdroom/hydrogen-view-sdk";
import { useSetAtom } from "jotai";

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
import { Footer } from "../../../atoms/footer/Footer";
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
import { useIsMounted } from "../../../hooks/useIsMounted";
import { uploadAttachment } from "../../../utils/matrixUtils";
import { MAX_OBJECT_CAP } from "../../../../engine/config.common";
import { OverlayWindow, overlayWindowAtom } from "../../../state/overlayWindow";
import { usePowerLevels } from "../../../hooks/usePowerLevels";
import { EmptyState } from "../../components/empty-state/EmptyState";

interface WorldSettingsProps {
  room: Room;
}

export function WorldSettings({ room }: WorldSettingsProps) {
  const { session, platform } = useHydrogen(true);

  const setOverlayWindow = useSetAtom(overlayWindowAtom);
  const { getPowerLevel, canSendStateEvent } = usePowerLevels(room);
  const myPowerLevel = getPowerLevel(session.userId);
  const isMounted = useIsMounted();

  let httpAvatarUrl = room?.avatarUrl
    ? getAvatarHttpUrl(room.avatarUrl, 150, platform, session.mediaRepository) ?? undefined
    : undefined;
  const { fileData: avatarData, pickFile: pickAvatar, dropFile: dropAvatar } = useFilePicker(platform, "image/*");
  const isAvatarChanged = (httpAvatarUrl || avatarData.blob) && (avatarData.dropUsed > 0 || avatarData.pickUsed > 0);
  httpAvatarUrl = isAvatarChanged ? avatarData.url : httpAvatarUrl;

  const roomName = room?.name ?? "Empty Name";
  const [newName, setNewName] = useState(roomName);

  const isPrivateRef = useRef(true);
  const [isPrivate, setIsPrivate] = useState(true);

  const [worldInfo, setWorldInfo] = useState<{ sceneUrl?: string; previewUrl?: string; maxObjectCap?: number }>({});

  const [sceneInfo, setSceneInfo] = useState<AutoUploadInfo>({});
  const [previewInfo, setPreviewInfo] = useState<AutoUploadInfo>({});
  const [scriptInfo, setScriptInfo] = useState<AutoUploadInfo>({});

  useEffect(() => {
    if (room) {
      room.getStateEvent("m.room.join_rules").then((event) => {
        if (!isMounted()) return;
        isPrivateRef.current = event?.event?.content.join_rule !== "public";
        setIsPrivate(event?.event?.content.join_rule !== "public");
      });
      Promise.all([room.getStateEvent("m.world"), room.getStateEvent("org.matrix.msc3815.world")])
        .then(([oldEvent, event]) => {
          if (!isMounted()) return;
          const oldContent = oldEvent?.event?.content;
          const content = event?.event?.content;
          setWorldInfo({
            sceneUrl: content?.scene_url || oldContent?.scene_url,
            previewUrl: content?.scene_preview_url || oldContent?.scene_preview_url,
          });
          const fetchedMaxObjectCap = content?.max_member_object_cap ?? MAX_OBJECT_CAP;
          maxObjectCapRef.current = fetchedMaxObjectCap;
          setMaxObjectCap(fetchedMaxObjectCap);
        })
        .catch(console.error);
    }
  }, [room, isMounted]);

  const handleNameChange = (evt: ChangeEvent<HTMLInputElement>) => setNewName(evt.target.value.trim());

  const maxObjectCapRef = useRef(MAX_OBJECT_CAP);
  const [maxObjectCap, setMaxObjectCap] = useState(MAX_OBJECT_CAP);
  const handleMaxObjectCapChange = (evt: ChangeEvent<HTMLInputElement>) =>
    setMaxObjectCap(parseInt(evt.target.value) || 0);

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (!room) return;
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
    if (isPrivateRef.current !== isPrivate) {
      session.hsApi.sendState(room.id, "m.room.join_rules", "", {
        join_rule: isPrivate ? "invite" : "public",
      });
    }
    if (roomName !== newName && newName.trim() !== "") {
      session.hsApi.sendState(room.id, "m.room.name", "", {
        name: newName,
      });
    }

    if (sceneInfo.mxc || previewInfo.mxc || maxObjectCap !== maxObjectCapRef.current || scriptInfo.mxc) {
      Promise.all([room.getStateEvent("m.world"), room.getStateEvent("org.matrix.msc3815.world")]).then(
        ([oldEvent, event]) => {
          const oldContent = oldEvent?.event?.content;
          const content = event?.event?.content;
          const existingScriptUrl = event?.event.content.script_url;
          session.hsApi.sendState(room.id, "org.matrix.msc3815.world", "", {
            max_member_object_cap: maxObjectCap,
            scene_url: sceneInfo.mxc ?? (content?.scene_url || oldContent?.scene_url),
            scene_preview_url: previewInfo.mxc ?? (content?.scene_preview_url || oldContent?.scene_preview_url),
            script_url: scriptInfo.mxc || existingScriptUrl,
          });
        }
      );
    }

    setOverlayWindow({ type: OverlayWindow.None });
  };

  return (
    <Window onRequestClose={() => setOverlayWindow({ type: OverlayWindow.None })}>
      <Content
        onSubmit={handleSubmit}
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
                        <SettingTile label={<Label>World Avatar</Label>}>
                          <AvatarPicker url={httpAvatarUrl} onAvatarPick={pickAvatar} onAvatarDrop={dropAvatar} />
                        </SettingTile>
                      </div>
                    )}
                    {(canSendStateEvent("m.room.name", myPowerLevel) ||
                      canSendStateEvent("m.room.join_rules", myPowerLevel)) && (
                      <div className="flex gap-lg">
                        {canSendStateEvent("m.room.name", myPowerLevel) && (
                          <SettingTile className="grow basis-0" label={<Label>World Name *</Label>}>
                            <Input onChange={handleNameChange} defaultValue={roomName} required />
                          </SettingTile>
                        )}
                        {canSendStateEvent("m.room.join_rules", myPowerLevel) && (
                          <SettingTile className="grow basis-0" label={<Label>Private</Label>}>
                            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                          </SettingTile>
                        )}
                      </div>
                    )}
                    {canSendStateEvent("org.matrix.msc3815.world", myPowerLevel) && (
                      <div className="flex gap-lg">
                        <SettingTile className="grow basis-0" label={<Label>Scene</Label>}>
                          <AutoFileUpload
                            mimeType=".glb"
                            onUploadInfo={setSceneInfo}
                            renderButton={(pickFile) => (
                              <Button fill="outline" onClick={pickFile}>
                                <Icon src={UploadIC} color="primary" />
                                Change Scene
                              </Button>
                            )}
                          />
                        </SettingTile>
                        <SettingTile className="grow basis-0" label={<Label>Scene Preview</Label>}>
                          <AutoFileUpload
                            mimeType="image/*"
                            onUploadInfo={setPreviewInfo}
                            renderButton={(pickFile) => (
                              <Button fill="outline" onClick={pickFile}>
                                <Icon src={UploadIC} color="primary" />
                                Change Preview
                              </Button>
                            )}
                          />
                        </SettingTile>
                      </div>
                    )}
                    {canSendStateEvent("org.matrix.msc3815.world", myPowerLevel) && (
                      <div className="flex gap-lg">
                        <SettingTile className="grow basis-0" label={<Label>Max Spawned Objects Per User</Label>}>
                          <Input type="number" value={maxObjectCap} onChange={handleMaxObjectCapChange} required />
                        </SettingTile>
                      </div>
                    )}
                    {canSendStateEvent("org.matrix.msc3815.world", myPowerLevel) && (
                      <div className="flex gap-lg">
                        <SettingTile className="grow basis-0" label={<Label>Script (EXPERIMENTAL)</Label>}>
                          <AutoFileUpload
                            mimeType=".js,.wasm"
                            onUploadInfo={setScriptInfo}
                            renderButton={(pickFile) => (
                              <Button fill="outline" onClick={pickFile}>
                                <Icon src={UploadIC} color="primary" />
                                Change Script
                              </Button>
                            )}
                          />
                        </SettingTile>
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
              bottom={
                <Footer
                  left={
                    <Button size="lg" fill="outline" onClick={() => setOverlayWindow({ type: OverlayWindow.None })}>
                      Cancel
                    </Button>
                  }
                  right={
                    <Button
                      size="lg"
                      type="submit"
                      disabled={
                        !isAvatarChanged &&
                        isPrivateRef.current === isPrivate &&
                        roomName === newName &&
                        !sceneInfo.mxc &&
                        !previewInfo.mxc &&
                        maxObjectCap === maxObjectCapRef.current &&
                        !scriptInfo.mxc
                      }
                    >
                      Save
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
                src={previewInfo.url ?? getHttpUrl(session, worldInfo.previewUrl)}
                alt="Scene Preview"
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
