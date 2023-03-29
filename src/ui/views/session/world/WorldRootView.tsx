import { ObservedStateKeyValue, Room, StateEvent, SubscriptionHandle } from "@thirdroom/hydrogen-view-sdk";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { useRoom } from "../../../hooks/useRoom";
import { useWorldLoader } from "../../../hooks/useWorldLoader";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { worldAtom } from "../../../state/world";
import { aliasToRoomId } from "../../../utils/matrixUtils";
import { WorldLoading } from "./WorldLoading";
import { WorldThumbnail } from "./WorldThumbnail";
import { WorldView } from "./WorldView";

function useNavigatedWorld() {
  const { session } = useHydrogen(true);
  const location = useLocation();
  const params = useParams();

  const worldId = params.worldId || aliasToRoomId(session.rooms, location.hash);
  const world = useRoom(session, worldId);

  return world;
}

function useFirstRender() {
  const ref = useRef(true);
  const firstRender = ref.current;
  ref.current = false;
  return firstRender;
}

async function getWorldContent(world: Room) {
  const stateEvent = await world.getStateEvent("org.matrix.msc3815.world");
  return stateEvent?.event.content;
}

export default function WorldRootView() {
  const [{ worldId, entered, loading }] = useAtom(worldAtom);
  const navigatedWorld = useNavigatedWorld();
  const firstRender = useFirstRender();
  const isMounted = useIsMounted();
  const [error, setError] = useState<Error>();
  const [, setOverlayVisibility] = useAtom(overlayVisibilityAtom);
  const { loadWorld, enterWorld, reloadWorld } = useWorldLoader();
  const reloadObservableRef = useRef<ObservedStateKeyValue | undefined>(undefined);

  useEffect(() => {
    setOverlayVisibility(!loading && !entered);
  }, [setOverlayVisibility, entered, loading]);

  /**
   * First time load via url
   */
  useEffect(() => {
    if (firstRender && navigatedWorld && !entered && !loading) {
      (async () => {
        const content = await getWorldContent(navigatedWorld);
        if (!content) return;

        await loadWorld(navigatedWorld, content);
        await enterWorld(navigatedWorld);
      })();
    }
  }, [firstRender, loading, entered, navigatedWorld, enterWorld, loadWorld]);

  /**
   * Reloading via state update
   */
  useEffect(() => {
    setError(undefined);

    if (!navigatedWorld || loading) return;

    const handleLoad = async (event: StateEvent | undefined) => {
      const content = event?.content;

      if (!entered || loading || !content) {
        return;
      }

      try {
        await reloadWorld(navigatedWorld, content);
      } catch (err) {
        setError(err as Error);
        console.error(err);
      }
    };

    let dispose: SubscriptionHandle;
    navigatedWorld.observeStateTypeAndKey("org.matrix.msc3815.world", "").then(async (observable) => {
      if (!isMounted() || reloadObservableRef.current || worldId !== navigatedWorld.id) return;

      reloadObservableRef.current = observable;
      dispose = observable.subscribe(handleLoad);
    });

    return () => {
      if (reloadObservableRef.current) {
        reloadObservableRef.current.unsubscribe(handleLoad);
        reloadObservableRef.current = undefined;
        dispose?.();
      }
    };
  }, [worldId, navigatedWorld, isMounted, entered, loading, reloadWorld]);

  return (
    <>
      {navigatedWorld && entered && <WorldView world={navigatedWorld} />}
      <WorldThumbnail />
      {navigatedWorld && <WorldLoading world={navigatedWorld} loading={loading} error={error} />}
    </>
  );
}
