import { Session } from "@thirdroom/hydrogen-view-sdk";
import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { worldAtom } from "../state/world";
import { roomIdToAlias } from "../utils/matrixUtils";

let worldReloadId = 0;

export function useWorldAction(session: Session) {
  const navigate = useNavigate();
  const setWorld = useSetAtom(worldAtom);

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
    setWorld({ type: "CLOSE" });
    navigate("/");
  }, [navigate, setWorld]);

  return {
    enterWorld,
    exitWorld,
  };
}
