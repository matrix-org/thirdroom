import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { IconButton } from "../../../atoms/button/IconButton";
import { Window } from "../../components/window/Window";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { UserProfileOverview } from "./UserProfileOverview";
import { UserProfileInventory } from "./UserProfileInventory";
import CrossIC from "../../../../../res/ic/cross.svg";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { OverlayWindow, overlayWindowAtom } from "../../../state/overlayWindow";
import { userProfileAtom } from "../../../state/userProfile";

enum UserProfileSegment {
  Overview = "Overview",
  Inventory = "Inventory",
}

export function UserProfile() {
  const { session, platform } = useHydrogen(true);
  const setOverlayWindow = useSetAtom(overlayWindowAtom);
  const { userId, displayName, avatarUrl } = useAtomValue(userProfileAtom);
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
            User Settings
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
