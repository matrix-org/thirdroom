import { useState, useCallback } from "react";
import { IBlobHandle } from "@thirdroom/hydrogen-view-sdk";

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
import AddIC from "../../../../../res/ic/add.svg";
import CrossCircleIC from "../../../../../res/ic/cross-circle.svg";
import "./UserProfileOverview.css";

export function UserProfileOverview() {
  const { platform } = useHydrogen(true);
  const { displayName } = useStore((state) => state.userProfile);
  const [avatarBlob, setAvatarBlob] = useState<IBlobHandle>();

  const handleAvatarSelect = useCallback(async () => {
    const data = await platform.openFile("image/*");
    if (!data) return;
    setAvatarBlob(data.blob);
  }, [setAvatarBlob, platform]);

  return (
    <WindowContent
      children={
        <Content>
          <Scroll>
            <div className="UserProfileOverview__content">
              <SettingTile label={<Label>Avatar</Label>}>
                <ThumbnailHover
                  content={
                    !avatarBlob ? undefined : (
                      <IconButton
                        variant="world"
                        onClick={() => setAvatarBlob(undefined)}
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
                      <IconButton onClick={handleAvatarSelect} size="xl" iconSrc={AddIC} label="Add world avatar" />
                    )}
                  </Thumbnail>
                </ThumbnailHover>
              </SettingTile>
              <div className="flex gap-lg">
                <SettingTile className="grow basis-0" label={<Label>Default Display Name</Label>}>
                  <Input defaultValue={displayName} />
                </SettingTile>
                <span className="grow basis-0" />
              </div>
            </div>
          </Scroll>
        </Content>
      }
      aside={
        <WindowAside className="flex">
          <ScenePreview
            className="grow"
            fallback={
              <Text variant="b3" color="surface-low" weight="medium">
                Your default avatar preview will appear here.
              </Text>
            }
          />
        </WindowAside>
      }
    />
  );
}
