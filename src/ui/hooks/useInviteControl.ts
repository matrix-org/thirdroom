import { useReducer } from "react";
import { Session } from "@thirdroom/hydrogen-view-sdk";

import { useInvite } from "./useInvite";
import { useIsMounted } from "./useIsMounted";

export function useInviteControl(session: Session, roomId: string) {
  const [, forceUpdate] = useReducer((v) => v + 1, 0);
  const isMounted = useIsMounted();
  const invite = useInvite(session, roomId);

  const accept = async () => {
    if (!invite) return;
    forceUpdate();
    // TODO: handle error when unable to join
    // when canonicalAlias is not available.
    await invite.accept();
    if (!isMounted()) return;
    forceUpdate();
  };
  const reject = async () => {
    if (!invite) return;
    forceUpdate();
    await invite.reject();
    if (!isMounted()) return;
    forceUpdate();
  };

  return { invite, accept, reject };
}
