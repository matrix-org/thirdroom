import { ObservedStateKeyValue, Room, StateEvent, SubscriptionHandle } from "@thirdroom/hydrogen-view-sdk";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { useRoom } from "../../../hooks/useRoom";
import { useWorldPath } from "../../../hooks/useWorld";
import { useWorldLoader } from "../../../hooks/useWorldLoader";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { overlayWorldAtom } from "../../../state/overlayWorld";
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
  const selectWorld = useSetAtom(overlayWorldAtom);
  const [roomId, reloadId] = useWorldPath();

  /**
   * Re-select, load, and enter into the world in which a load attempt was made but errored out
   */
  useEffect(() => {
    if (roomId && reloadId && navigatedWorld) {
      selectWorld(roomId);

      (async () => {
        try {
          const content = await getWorldContent(navigatedWorld);
          if (!content) return;
          await loadWorld(navigatedWorld, content);
          await enterWorld(navigatedWorld);
        } catch (err) {
          setError(err as Error);
          console.error(err);
        }
      })();
    }
  }, [roomId, reloadId, selectWorld, navigatedWorld, enterWorld, loadWorld]);

  /**
   * Selects the world we are entered into for display in the overlay
   */
  useEffect(() => {
    if (navigatedWorld) {
      selectWorld(navigatedWorld.id);
    }
  }, [navigatedWorld, selectWorld]);

  /**
   * Hides the overlay while loading into a world
   */
  useEffect(() => {
    setOverlayVisibility(!loading && !entered);
  }, [setOverlayVisibility, entered, loading]);

  /**
   * First time load via url
   */
  useEffect(() => {
    if (firstRender && navigatedWorld && !entered && !loading) {
      (async () => {
        try {
          const content = await getWorldContent(navigatedWorld);
          if (!content) return;

          await loadWorld(navigatedWorld, content);
          await enterWorld(navigatedWorld);
        } catch (err) {
          setError(err as Error);
          console.error(err);
        }
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
