import { Session } from "hydrogen-view-sdk";

import { useObservableMap } from "./useObservableMap";

export function useCalls(session: Session) {
  return useObservableMap(() => session.callHandler.calls, [session]);
}
