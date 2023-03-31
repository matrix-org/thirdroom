import { Room, Session } from "@thirdroom/hydrogen-view-sdk";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { roomIdToAlias } from "../utils/matrixUtils";
import { useWorldLoader } from "./useWorldLoader";

let worldReloadId = 0;

export function useWorldNavigator(session: Session) {
  const navigate = useNavigate();
  const { exitWorld } = useWorldLoader();

  const navigateEnterWorld = useCallback(
    (
      world: Room,
      options?: {
        reload?: boolean;
      }
    ) => {
      const { reload } = options ?? {};

      const worldAlias = roomIdToAlias(session.rooms, world.id);
      const reloadPath = reload ? `?reload=${++worldReloadId}` : "";

      navigate(`/world/${worldAlias ?? world.id}${reloadPath}`);
    },
    [session.rooms, navigate]
  );

  const navigateExitWorld = useCallback(() => {
    exitWorld();
    navigate("/");
  }, [navigate, exitWorld]);

  return {
    navigateEnterWorld,
    navigateExitWorld,
  };
}
