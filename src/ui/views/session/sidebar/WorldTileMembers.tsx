import { GroupCall, Member, Platform, Session } from "@thirdroom/hydrogen-view-sdk";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { AvatarPile } from "../../../atoms/avatar/AvatarPile";
import { Text } from "../../../atoms/text/Text";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
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
  const allMembers = useObservableMap(() => groupCall.members, [groupCall]);
  const members = [...allMembers.values()].reduce((filtered, member) => {
    if (!filtered.has(member.userId)) filtered.set(member.userId, member);
    return filtered;
  }, new Map<string, Member>());

  if (members.size === 0) return null;

  return (
    <AvatarPile>
      {Array.from(members.values())
        .slice(0, maxAvatars)
        .map(({ member }, index) => (
          <Tooltip content={member.name} side="top" key={member.userId}>
            <Avatar
              style={index > 0 ? { marginLeft: "calc(-1 * var(--av-xxs) / 4)" } : {}}
              name={member.displayName || getMxIdUsername(member.userId)}
              bgColor={`var(--usercolor${getIdentifierColorNumber(member.userId)})`}
              imageSrc={
                member.avatarUrl ? getAvatarHttpUrl(member.avatarUrl, 20, platform, session.mediaRepository) : undefined
              }
              shape="circle"
              size="xxs"
            />
          </Tooltip>
        ))}
      {members.size > maxAvatars ? <Text variant="b3" type="span">{`+${members.size - maxAvatars}`}</Text> : undefined}
    </AvatarPile>
  );
}
