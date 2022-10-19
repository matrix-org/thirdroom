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

const maxAvatars = 5;

export function WorldTileMembers({ session, platform, groupCall }: WorldTileMembersProps) {
  const members = useObservableMap(() => groupCall.members, [groupCall]);

  if (members.size === 0) return null;

  return (
    <AvatarPile>
      {Array.from(members.values())
        .slice(0, maxAvatars)
        .map(({ member }) => (
          <Avatar
            key={member.userId}
            name={member.displayName || getMxIdUsername(member.userId)}
            bgColor={`var(--usercolor${getIdentifierColorNumber(member.userId)})`}
            imageSrc={
              member.avatarUrl ? getAvatarHttpUrl(member.avatarUrl, 20, platform, session.mediaRepository) : undefined
            }
            shape="circle"
            size="xxs"
          />
        ))}
      {members.size > maxAvatars ? <span>{`+${members.size - maxAvatars}`}</span> : undefined}
    </AvatarPile>
  );
}
