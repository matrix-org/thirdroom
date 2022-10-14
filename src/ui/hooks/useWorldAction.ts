import { Session } from "@thirdroom/hydrogen-view-sdk";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { roomIdToAlias } from "../utils/matrixUtils";
import { useStore } from "./useStore";

let worldReloadId = 0;

export function useWorldAction(session: Session) {
  const navigate = useNavigate();

  const enterWorld = useCallback(
    (
      worldId: string,
      options?: {
        reload?: boolean;
      }
    ) => {
      const { reload } = options ?? {};

      const worldAlias = roomIdToAlias(session.rooms, worldId);
      const reloadPath = reload ? `?reload=${++worldReloadId}` : "";

      navigate(`/world/${worldAlias ?? worldId}${reloadPath}`);
    },
    [session.rooms, navigate]
  );

  const exitWorld = useCallback(() => {
    const world = useStore.getState().world;
    if (world.worldId) {
      world.disposeNetworkInterface?.();
      world.closeWorld();
    }
    navigate("/");
  }, [navigate]);

  return {
    enterWorld,
    exitWorld,
  };
}
