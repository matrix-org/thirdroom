import { FormEvent } from "react";

import { IconButton } from "../../../atoms/button/IconButton";
import { Content } from "../../../atoms/content/Content";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { Window } from "../../components/window/Window";
import CrossCircleIC from "../../../../../res/ic/cross-circle.svg";
import { WindowContent } from "../../components/window/WindowContent";
import { WindowAside } from "../../components/window/WindowAside";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import { useStore } from "../../../hooks/useStore";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Footer } from "../../../atoms/footer/Footer";
import { Button } from "../../../atoms/button/Button";
import { Text } from "../../../atoms/text/Text";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Label } from "../../../atoms/text/Label";
import { AvatarPicker } from "../../components/avatar-picker/AvatarPicker";
import { useFilePicker } from "../../../hooks/useFilePicker";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useRoom } from "../../../hooks/useRoom";
import "./WorldSettings.css";
import { getAvatarHttpUrl } from "../../../utils/avatar";
import { Input } from "../../../atoms/input/Input";
import { Switch } from "../../../atoms/button/Switch";

interface WorldSettingsProps {
  roomId: string;
}

export function WorldSettings({ roomId }: WorldSettingsProps) {
  const { session, platform } = useHydrogen(true);

  const { closeWindow } = useStore((state) => state.overlayWindow);
  const room = useRoom(session, roomId);
  const roomName = room?.name ?? "";
  const avatarUrl = room?.avatarUrl
    ? getAvatarHttpUrl(room.avatarUrl, 150, platform, session.mediaRepository) ?? undefined
    : undefined;

  const { fileData: avatarData, pickFile: pickAvatar, dropFile: dropAvatar } = useFilePicker(platform, "image/*");
  const httpAvatarUrl = avatarData.dropUsed > 0 ? avatarData.url : avatarUrl;

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
  };

  return (
    <Window>
      <Content
        onSubmit={handleSubmit}
        top={
          <Header
            left={<HeaderTitle>World Settings</HeaderTitle>}
            right={<IconButton onClick={() => closeWindow()} label="Close" iconSrc={CrossCircleIC} />}
          />
        }
      >
        <WindowContent
          children={
            <Content
              children={
                <Scroll>
                  <div className="WorldSettings__content">
                    <div className="flex gap-lg">
                      <SettingTile label={<Label>World Avatar</Label>}>
                        <AvatarPicker url={httpAvatarUrl} onAvatarPick={pickAvatar} onAvatarDrop={dropAvatar} />
                      </SettingTile>
                    </div>
                    <div className="flex gap-lg">
                      <SettingTile className="grow" label={<Label>World Name</Label>}>
                        <Input defaultValue={roomName} />
                      </SettingTile>
                      <SettingTile className="grow" label={<Label>Private</Label>}>
                        <Switch />
                      </SettingTile>
                    </div>
                    <div className="flex gap-gl">
                      <SettingTile className="grow" label={<Label>Scene</Label>}>
                        <div />
                      </SettingTile>
                      <SettingTile className="grow" label={<Label>Scene Preview</Label>}>
                        <div />
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
                    <Button size="lg" type="submit" disabled={true}>
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
