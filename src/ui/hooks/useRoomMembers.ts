import { useEffect, useState } from "react";
import { MemberList, ObservableMap, Room, RoomMember } from "@thirdroom/hydrogen-view-sdk";

import { useObservableMap } from "./useObservableMap";
import { useIsMounted } from "./useIsMounted";

export function useRoomMembers(room: Room) {
  const [memberList, setMemberList] = useState<MemberList>();
  const members = useObservableMap(
    () => memberList?.members || new ObservableMap<string, RoomMember>(),
    [memberList?.members]
  );
  const isMounted = useIsMounted();

  useEffect(() => {
    return () => {
      memberList?.release();
    };
  }, [memberList]);

  useEffect(() => {
    room.loadMemberList().then((mList) => {
      if (!isMounted()) return;
      setMemberList(mList);
    });
  }, [room, isMounted]);

  return members;
}
