import { useState } from "react";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { IconButton } from "../../../atoms/button/IconButton";
import { Window } from "../../components/window/Window";
import { WindowHeader } from "../../components/window/WindowHeader";
import { WindowHeaderTitle } from "../../components/window/WindowHeaderTitle";
import { SegmentControl } from "../../../atoms/segment-control/SegmentControl";
import { SegmentControlItem } from "../../../atoms/segment-control/SegmentControlItem";
import { useStore } from "../../../hooks/useStore";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { UserProfileOverview } from "./UserProfileOverview";
import { UserProfileInventory } from "./UserProfileInventory";
import CrossCircleIC from "../../../../../res/ic/cross-circle.svg";
import { useHydrogen } from "../../../hooks/useHydrogen";

enum UserProfileSegment {
  Overview = "Overview",
  Inventory = "Inventory",
}

export function UserProfile() {
  const { session, platform } = useHydrogen(true);
  const { selectWindow } = useStore((state) => state.overlayWindow);
  const { userId, displayName, avatarUrl } = useStore((state) => state.userProfile);
  const [selectedSegment, setSelectedSegment] = useState(UserProfileSegment.Overview);

  return (
    <Window>
      <WindowHeader
        left={
          <WindowHeaderTitle
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
          </WindowHeaderTitle>
        }
        center={
          <SegmentControl>
            <SegmentControlItem
              value={UserProfileSegment.Overview}
              isSelected={selectedSegment === UserProfileSegment.Overview}
              onSelect={setSelectedSegment}
            >
              Overview
            </SegmentControlItem>
            <SegmentControlItem
              value={UserProfileSegment.Inventory}
              isSelected={selectedSegment === UserProfileSegment.Inventory}
              onSelect={setSelectedSegment}
            >
              Inventory
            </SegmentControlItem>
          </SegmentControl>
        }
        right={<IconButton onClick={() => selectWindow()} iconSrc={CrossCircleIC} label="Close" />}
      />
      {selectedSegment === UserProfileSegment.Overview && <UserProfileOverview />}
      {selectedSegment === UserProfileSegment.Inventory && <UserProfileInventory />}
    </Window>
  );
}
