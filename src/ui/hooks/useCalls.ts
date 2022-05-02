import { MatrixClient } from "@thirdroom/matrix-js-sdk";
import { useEffect, useState } from "react";

export function useCalls(client: MatrixClient) {
  const [groupCalls, setGroupCalls] = useState(() => new Map(client.groupCallEventHandler.groupCalls));

  useEffect(() => {
    function onGroupCallIncoming() {
      setGroupCalls(new Map(client.groupCallEventHandler.groupCalls));
    }

    setGroupCalls(new Map(client.groupCallEventHandler.groupCalls));

    client.addListener("GroupCall.incoming", onGroupCallIncoming);

    return () => {
      client.removeListener("GroupCall.incoming", onGroupCallIncoming);
    };
  }, [client]);

  return groupCalls;
}
