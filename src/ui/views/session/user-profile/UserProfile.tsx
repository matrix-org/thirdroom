import { useState } from "react";
import { useSetAtom } from "jotai";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { IconButton } from "../../../atoms/button/IconButton";
import { Window } from "../../components/window/Window";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { useStore } from "../../../hooks/useStore";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { UserProfileOverview } from "./UserProfileOverview";
import { UserProfileInventory } from "./UserProfileInventory";
import CrossIC from "../../../../../res/ic/cross.svg";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { OverlayWindow, overlayWindowAtom } from "../../../state/overlayWindow";

enum UserProfileSegment {
  Overview = "Overview",
  Inventory = "Inventory",
}

export function UserProfile() {
  const { session, platform } = useHydrogen(true);
  const setOverlayWindow = useSetAtom(overlayWindowAtom);
  const { userId, displayName, avatarUrl } = useStore((state) => state.userProfile);
  const [selectedSegment] = useState(UserProfileSegment.Overview);

  return (
    <Window onRequestClose={() => setOverlayWindow({ type: OverlayWindow.None })}>
      <Header
        left={
          <HeaderTitle
            icon={
              <Avatar
                name={displayName}
                bgColor={`var(--usercolor${getIdentifierColorNumber(userId)})`}
                imageSrc={avatarUrl ? getAvatarHttpUrl(avatarUrl, 20, platform, session.mediaRepository) : undefined}
                shape="circle"
                size="xxs"
              />
            }
          >
            Profile
          </HeaderTitle>
        }
        right={
          <IconButton onClick={() => setOverlayWindow({ type: OverlayWindow.None })} iconSrc={CrossIC} label="Close" />
        }
      />
      {selectedSegment === UserProfileSegment.Overview && <UserProfileOverview />}
      {selectedSegment === UserProfileSegment.Inventory && <UserProfileInventory />}
    </Window>
  );
}
