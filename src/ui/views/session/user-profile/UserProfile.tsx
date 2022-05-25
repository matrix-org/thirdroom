import { Avatar } from "../../../atoms/avatar/Avatar";
import { IconButton } from "../../../atoms/button/IconButton";
import { Content } from "../../../atoms/content/Content";
import { Window } from "../../components/window/Window";
import { WindowHeader } from "../../components/window/WindowHeader";
import { WindowHeaderTitle } from "../../components/window/WindowHeaderTitle";
import { WindowContent } from "../../components/window/WindowContent";
import { useStore } from "../../../hooks/useStore";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useUserProfile } from "../../../hooks/useUserProfile";
import { getIdentifierColorNumber } from "../../../utils/avatar";
import CrossCircleIC from "../../../../../res/ic/cross-circle.svg";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Input } from "../../../atoms/input/Input";
import { Label } from "../../../atoms/text/Label";
import "./UserProfile.css";

export function UserProfile() {
  const { session } = useHydrogen(true);
  const { selectWindow } = useStore((state) => state.overlayWindow);
  const { userId, displayName, avatarUrl } = useUserProfile(session);

  return (
    <Window>
      <WindowHeader
        left={
          <WindowHeaderTitle
            icon={
              <Avatar
                name={displayName ?? userId}
                bgColor={`var(--usercolor${getIdentifierColorNumber(userId)})`}
                imageSrc={avatarUrl}
                shape="circle"
                size="xxs"
              />
            }
          >
            Profile
          </WindowHeaderTitle>
        }
        right={<IconButton onClick={() => selectWindow()} iconSrc={CrossCircleIC} label="Close" />}
      />
      <WindowContent
        children={
          <Content>
            <Scroll>
              <div className="UserProfile__content">
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
        aside={" "}
      />
    </Window>
  );
}
