import { Invite, Session } from "@thirdroom/hydrogen-view-sdk";

import { useObservableMap } from "./useObservableMap";

export function useInvite(session: Session, roomId: string | undefined): Invite | undefined {
  const invites = useObservableMap(() => session.invites, [session.invites]);
  return roomId ? invites.get(roomId) : undefined;
}
