import React, { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { AttachmentUpload, IBlobHandle } from "@thirdroom/hydrogen-view-sdk";

import { IconButton } from "../../../atoms/button/IconButton";
import { Content } from "../../../atoms/content/Content";
import { WindowContent } from "../../components/window/WindowContent";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useStore } from "../../../hooks/useStore";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Input } from "../../../atoms/input/Input";
import { Label } from "../../../atoms/text/Label";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import { Text } from "../../../atoms/text/Text";
import { WindowAside } from "../../components/window/WindowAside";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import { ThumbnailHover } from "../../../atoms/thumbnail/ThumbnailHover";
import { getAvatarHttpUrl, getHttpUrl } from "../../../utils/avatar";
import { Footer } from "../../../atoms/footer/Footer";
import { Button } from "../../../atoms/button/Button";
import { useDebounce } from "../../../hooks/useDebounce";
import { use3DAvatar } from "../../../hooks/use3DAvatar";
import { Edit3DAvatar } from "./Edit3DAvatar";
import AddIC from "../../../../../res/ic/add.svg";
import CrossCircleIC from "../../../../../res/ic/cross-circle.svg";
import "./UserProfileOverview.css";

export function UserProfileOverview() {
  const { session, platform, profileRoom } = useHydrogen(true);
  const { displayName, avatarUrl } = useStore((state) => state.userProfile);
  const { selectWindow } = useStore((state) => state.overlayWindow);

  const [newDisplayName, setNewDisplayName] = useState(displayName);
  const [newAvatar, setNewAvatar] = useState<IBlobHandle | string | undefined>(avatarUrl);
  const [, tDAvatarPreviewUrl] = use3DAvatar(profileRoom);

  const avatarHttpUrl: string | null | undefined = !newAvatar
    ? undefined
    : typeof newAvatar === "string"
    ? getAvatarHttpUrl(newAvatar, 150, platform, session.mediaRepository)
    : URL.createObjectURL(newAvatar.nativeBlob);

  const handleAvatarSelect = useCallback(async () => {
    const data = await platform.openFile("image/*");
    if (!data) return;
    setNewAvatar(data.blob);
  }, [platform]);

  const handleAvatarRemove = () => setNewAvatar(undefined);

  const debounceDisplayNameChange = useDebounce(setNewDisplayName, { wait: 200 });
  const onDisplayNameChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const name = evt.currentTarget.value.trim();
    debounceDisplayNameChange(name);
  };

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    selectWindow();
    const name = evt.currentTarget.displayName.value.trim() as string;
    if (name !== displayName && name !== "") {
      session.hsApi.setProfileDisplayName(session.userId, name);
    }
    if (newAvatar !== avatarUrl) {
      let url = "";
      if (typeof newAvatar === "object") {
        const nativeBlob = newAvatar.nativeBlob;

        const attachment = new AttachmentUpload({ filename: nativeBlob.name, blob: newAvatar, platform });
        await attachment.upload(session.hsApi, () => undefined);
        const content = {} as { url?: string };
        attachment.applyToContent("url", content);
        url = content.url ?? "";
      }
      session.hsApi.setProfileAvatarUrl(session.userId, url);
    }
  };
  const handleReset = () => {
    setNewDisplayName(displayName);
    setNewAvatar(avatarUrl);
    selectWindow();
  };

  return (
    <WindowContent
      children={
        <Content
          onSubmit={handleSubmit}
          onReset={handleReset}
          children={
            <Scroll>
              <div className="UserProfileOverview__content">
                <div className="flex gap-lg">
                  <SettingTile label={<Label>Profile Picture</Label>}>
                    <ThumbnailHover
                      content={
                        !avatarHttpUrl ? undefined : (
                          <IconButton
                            variant="world"
                            onClick={handleAvatarRemove}
                            size="xl"
                            iconSrc={CrossCircleIC}
                            label="Remove Profile Picture"
                          />
                        )
                      }
                    >
                      <Thumbnail size="sm" className="flex">
                        {avatarHttpUrl ? (
                          <ThumbnailImg src={avatarHttpUrl} />
                        ) : (
                          <IconButton
                            onClick={handleAvatarSelect}
                            size="xl"
                            iconSrc={AddIC}
                            label="Upload Profile Picture"
                          />
                        )}
                      </Thumbnail>
                    </ThumbnailHover>
                  </SettingTile>
                  <SettingTile className="grow basis-0" label={<Label>3D Avatar</Label>}>
                    <Edit3DAvatar
                      renderTrigger={(openModal) => (
                        <ThumbnailHover
                          content={
                            !tDAvatarPreviewUrl ? undefined : (
                              <IconButton
                                variant="world"
                                onClick={openModal}
                                size="xl"
                                iconSrc={AddIC}
                                label="Edit 3D Avatar"
                              />
                            )
                          }
                        >
                          <Thumbnail size="sm" className="flex">
                            {tDAvatarPreviewUrl ? (
                              <ThumbnailImg src={tDAvatarPreviewUrl} />
                            ) : (
                              <IconButton onClick={openModal} size="xl" iconSrc={AddIC} label="Add world avatar" />
                            )}
                          </Thumbnail>
                        </ThumbnailHover>
                      )}
                    />
                  </SettingTile>
                </div>
                <div className="flex gap-lg">
                  <SettingTile className="grow basis-0" label={<Label>Default Display Name</Label>}>
                    <Input name="displayName" onChange={onDisplayNameChange} defaultValue={displayName} required />
                  </SettingTile>
                  <span className="grow basis-0" />
                </div>
              </div>
            </Scroll>
          }
          bottom={
            (displayName !== newDisplayName || avatarUrl !== newAvatar) && (
              <Footer
                left={
                  <Button fill="outline" type="reset">
                    Cancel
                  </Button>
                }
                right={<Button type="submit">Save</Button>}
              />
            )
          }
        />
      }
      aside={
        <WindowAside className="flex">
          <ScenePreview
            className="grow"
            src={getHttpUrl(session, tDAvatarPreviewUrl)}
            alt="3D Avatar preview"
            fallback={
              <Text variant="b3" color="surface-low" weight="medium">
                Your 3D avatar preview will appear here.
              </Text>
            }
          />
        </WindowAside>
      }
    />
  );
}
