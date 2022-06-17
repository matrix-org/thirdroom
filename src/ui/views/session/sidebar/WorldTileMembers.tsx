import { GroupCall, Platform, Session } from "@thirdroom/hydrogen-view-sdk";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { AvatarPile } from "../../../atoms/avatar/AvatarPile";
import { useObservableMap } from "../../../hooks/useObservableMap";
import { getIdentifierColorNumber } from "../../../utils/avatar";
import { getAvatarHttpUrl } from "../../../utils/avatar";
import { getMxIdUsername } from "../../../utils/matrixUtils";

interface WorldTileMembersProps {
  session: Session;
  platform: Platform;
  groupCall: GroupCall;
}

export function WorldTileMembers({ session, platform, groupCall }: WorldTileMembersProps) {
  const members = useObservableMap(() => groupCall.members, [groupCall]);
  const roomMembers = new Map();

  Array.from(members).forEach(([userIdDeviceId, member]) => {
    if (member.isConnected === false) return;
    roomMembers.set(member.userId, member.member);
  });

  if (roomMembers.size === 0) return null;
  return (
    <AvatarPile>
      {Array.from(roomMembers).map(([userId, member]) => (
        <Avatar
          key={userId}
          name={member.displayName || getMxIdUsername(userId)}
          bgColor={`var(--usercolor${getIdentifierColorNumber(userId)})`}
          imageSrc={
            member.avatarUrl ? getAvatarHttpUrl(member.avatarUrl, 20, platform, session.mediaRepository) : undefined
          }
          shape="circle"
          size="xxs"
        />
      ))}
    </AvatarPile>
  );
}
