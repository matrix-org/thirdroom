import { Room } from "@thirdroom/hydrogen-view-sdk";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { useRoom } from "../../../hooks/useRoom";
import { useWorldLoader } from "../../../hooks/useWorldLoader";
import { useWorldNavigator } from "../../../hooks/useWorldNavigator";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { worldAtom } from "../../../state/world";
import { aliasToRoomId } from "../../../utils/matrixUtils";
import { WorldLoading } from "./WorldLoading";
import { WorldThumbnail } from "./WorldThumbnail";

function useNavigatedWorld() {
  const { session } = useHydrogen(true);
  const location = useLocation();
  const params = useParams();

  const worldId = params.worldId || aliasToRoomId(session.rooms, location.hash);
  const world = useRoom(session, worldId);

  return world;
}

async function getWorldContent(world: Room) {
  const stateEvent = await world.getStateEvent("org.matrix.msc3815.world");
  return stateEvent?.event.content;
}

export default function LoadRootView() {
  const { session } = useHydrogen(true);

  const navigatedWorld = useNavigatedWorld();

  const [error] = useState<Error>();
  const [{ loading, entered }] = useAtom(worldAtom);

  const worldLoader = useWorldLoader();
  const { loadWorld, enterWorld } = worldLoader;

  const { navigateEnterWorld } = useWorldNavigator(session);

  const [, setOverlayVisibility] = useAtom(overlayVisibilityAtom);
  useEffect(() => {
    setOverlayVisibility(!loading);
  }, [setOverlayVisibility, loading]);

  useEffect(() => {
    (async () => {
      if (navigatedWorld && !loading && !entered) {
        const content = await getWorldContent(navigatedWorld);
        if (!content) return;

        await loadWorld(navigatedWorld, content);
        await enterWorld(navigatedWorld);

        navigateEnterWorld(navigatedWorld);
      }
    })();
  }, [navigatedWorld, loading, entered, loadWorld, enterWorld, navigateEnterWorld]);

  return (
    <>
      {navigatedWorld && <WorldLoading world={navigatedWorld} loading={loading} error={error} />}
      <WorldThumbnail />
    </>
  );
}
