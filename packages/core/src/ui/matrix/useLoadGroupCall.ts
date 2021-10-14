import { GroupCall } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCall";
import { useContext, useEffect, useState } from "react";
import { ClientContext } from "./ClientContext";
import { fetchGroupCall } from "./fetchGroupCall";

interface UseLoadGroupCallState {
  loading: boolean;
  error?: Error;
  groupCall?: GroupCall;
}

export function useLoadGroupCall(roomId: string) {
  const { client } = useContext(ClientContext);
  const [state, setState] = useState<UseLoadGroupCallState>({
    loading: true,
    error: undefined,
    groupCall: undefined,
  });

  useEffect(() => {
    setState({ loading: true });

    fetchGroupCall(client!, roomId)
      .then((groupCall) => setState({ loading: false, groupCall }))
      .catch((error) => setState({ loading: false, error }));
  }, [roomId]);

  return state;
}
