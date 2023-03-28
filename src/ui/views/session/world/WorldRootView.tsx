import { ObservedStateKeyValue, StateEvent } from "@thirdroom/hydrogen-view-sdk";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { useWorldPath } from "../../../hooks/useWorld";
import { useWorldLoader } from "../../../hooks/useWorldLoader";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { overlayWorldAtom } from "../../../state/overlayWorld";
import { worldAtom } from "../../../state/world";
import { WorldLoading } from "./WorldLoading";
import { WorldThumbnail } from "./WorldThumbnail";
import { WorldView } from "./WorldView";

function useFirstRender() {
  const ref = useRef(true);
  const firstRender = ref.current;
  ref.current = false;
  return firstRender;
}

export default function WorldRootView() {
  const params = useParams();
  const { worldId: worldIdAtom, entered, loading } = useAtomValue(worldAtom);
  const worldId = params.worldId || worldIdAtom;

  const { session } = useHydrogen(true);
  const world = worldId ? session.rooms.get(worldId) : undefined;

  const firstRender = useFirstRender();
  const isMounted = useIsMounted();
  const [error, setError] = useState<Error>();
  const mainThread = useMainThreadContext();
  const [, reloadId] = useWorldPath();
  const selectWorld = useSetAtom(overlayWorldAtom);
  const { loadWorld, enterWorld, reloadWorld } = useWorldLoader();
  const [, setOverlayVisibility] = useAtom(overlayVisibilityAtom);

  useEffect(() => {
    if (worldId && session.rooms.get(worldId)) {
      selectWorld(worldId);
    }
  }, [selectWorld, worldId, session.rooms]);

  useEffect(() => {
    const shouldBeVisible = !loading && !entered;
    setOverlayVisibility(shouldBeVisible);
  }, [setOverlayVisibility, entered, loading]);

  useEffect(() => {
    setError(undefined);
    let observableHandle: ObservedStateKeyValue;

    if (!world) return;

    const handleLoad = async (event: StateEvent | undefined) => {
      const content = event?.content;

      if (loading || !world || !content) {
        return;
      }

      try {
        // reload if already in world
        if (entered) {
          await reloadWorld(world, content);
        } else {
          // otherwise load in
          await loadWorld(world, content);
          await enterWorld(world);
        }
      } catch (err) {
        setError(err as Error);
        console.error(err);
      }
    };

    world.observeStateTypeAndKey("org.matrix.msc3815.world", "").then(async (observable) => {
      if (!isMounted() || !observable) return;

      observableHandle = observable;
      observable.subscribe(handleLoad);

      // on first render, trigger load
      if (firstRender) {
        const initialEvent = observable.get();
        handleLoad(initialEvent);
      }
    });

    return () => {
      if (observableHandle) observableHandle.unsubscribe(handleLoad);
    };
  }, [
    session,
    world,
    reloadId,
    isMounted,
    mainThread,
    loadWorld,
    enterWorld,
    entered,
    loading,
    reloadWorld,
    firstRender,
  ]);

  return (
    <>
      {world && entered && <WorldView world={world} />}
      <WorldThumbnail />
      {world && <WorldLoading world={world} loading={loading} error={error} />}
    </>
  );
}
