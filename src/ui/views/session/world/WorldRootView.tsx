import { ObservedStateKeyValue, StateEvent, SubscriptionHandle } from "@thirdroom/hydrogen-view-sdk";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { useRoom } from "../../../hooks/useRoom";
import { useWorldPath } from "../../../hooks/useWorld";
import { useWorldLoader } from "../../../hooks/useWorldLoader";
import { useWorldNavigator } from "../../../hooks/useWorldNavigator";
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

export default function WorldRootView() {
  const { session } = useHydrogen(true);
  const [{ worldId, entered, loading }] = useAtom(worldAtom);
  const navigatedWorld = useNavigatedWorld();
  const firstRender = useFirstRender();
  const isMounted = useIsMounted();
  const [error, setError] = useState<Error>();
  const mainThread = useMainThreadContext();
  const [, reloadId] = useWorldPath();
  const [, setOverlayVisibility] = useAtom(overlayVisibilityAtom);
  const { loadWorld, enterWorld, exitWorld, reloadWorld } = useWorldLoader();
  const reloadObservableRef = useRef<ObservedStateKeyValue | undefined>(undefined);
  const { navigateLoadWorld, navigateExitWorld } = useWorldNavigator(session);

  useEffect(() => {
    setOverlayVisibility(!loading && !entered);
  }, [setOverlayVisibility, entered, loading]);

  /**
   * First time load via url
   */
  useEffect(() => {
    if (firstRender && !entered && !loading && navigatedWorld) {
      navigateExitWorld();
      navigateLoadWorld(navigatedWorld);
    }
  }, [firstRender, loading, entered, navigatedWorld, navigateLoadWorld, navigateExitWorld]);

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
  }, [
    worldId,
    navigatedWorld,
    reloadId,
    isMounted,
    mainThread,
    loadWorld,
    enterWorld,
    exitWorld,
    navigateLoadWorld,
    navigateExitWorld,
    entered,
    loading,
    reloadWorld,
  ]);

  return (
    <>
      {navigatedWorld && entered && <WorldView world={navigatedWorld} />}
      <WorldThumbnail />
      {navigatedWorld && <WorldLoading world={navigatedWorld} loading={loading} error={error} />}
    </>
  );
}
