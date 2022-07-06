import { Invite, Session } from "@thirdroom/hydrogen-view-sdk";

import { useObservableList } from "./useObservableList";

function roomListComparator(a: Invite, b: Invite) {
  return b.timestamp - a.timestamp;
}

export function useInviteList(session: Session): Invite[] {
  return useObservableList(() => session.invites.sortValues(roomListComparator), [session.invites]);
}
