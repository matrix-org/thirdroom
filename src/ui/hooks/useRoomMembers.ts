import { useEffect, useState } from "react";
import { ObservableMap, Room, RoomMember } from "@thirdroom/hydrogen-view-sdk";

import { useIsMounted } from "./useIsMounted";

interface MembersType {
  invited: RoomMember[];
  joined: RoomMember[];
  leaved: RoomMember[];
  banned: RoomMember[];
}

export function useRoomMembers(room: Room) {
  const [members, setMembers] = useState<MembersType>();
  const isMounted = useIsMounted();

  const getMembers = (m: ObservableMap<string, RoomMember>) => {
    const members: MembersType = {
      invited: [],
      joined: [],
      leaved: [],
      banned: [],
    };
    for (const [, member] of m) {
      if (member.membership === "invite") members.invited.push(member);
      else if (member.membership === "join") members.joined.push(member);
      else if (member.membership === "leave") members.leaved.push(member);
      else if (member.membership === "ban") members.banned.push(member);
    }
    return members;
  };

  useEffect(() => {
    let unSub: () => void | undefined;
    room.loadMemberList().then((mList) => {
      if (!isMounted()) return;
      const { members } = mList;
      setMembers(getMembers(members));

      unSub = members.subscribe({
        onReset: () => setMembers(getMembers(members)),
        onAdd: () => setMembers(getMembers(members)),
        onUpdate: () => setMembers(getMembers(members)),
        onRemove: () => setMembers(getMembers(members)),
      });
    });

    return () => {
      unSub?.();
    };
  }, [room, isMounted]);

  return members;
}
