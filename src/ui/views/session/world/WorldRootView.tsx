import { Room, StateEvent, SubscriptionHandle } from "@thirdroom/hydrogen-view-sdk";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { useRoom } from "../../../hooks/useRoom";
import { useWorldPath } from "../../../hooks/useWorld";
import { useWorldLoader } from "../../../hooks/useWorldLoader";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { overlayWorldAtom } from "../../../state/overlayWorld";
import { worldAtom } from "../../../state/world";
import { WorldLoading } from "./WorldLoading";
import { WorldThumbnail } from "./WorldThumbnail";
import { WorldView } from "./WorldView";
import { editorEnabledAtom } from "../../../state/editor";

async function getWorldContent(world: Room) {
  const stateEvent = await world.getStateEvent("org.matrix.msc3815.world");
  return stateEvent?.event.content;
}

export default function WorldRootView() {
  const { entered, loading } = useAtomValue(worldAtom);
  const setWorld = useSetAtom(worldAtom);
  const { session } = useHydrogen(true);
  const isMounted = useIsMounted();
  const [error, setError] = useState<Error>();
  const setOverlayVisibility = useSetAtom(overlayVisibilityAtom);
  const { loadAndEnterWorld, reloadWorld, exitWorld } = useWorldLoader();
  const selectWorld = useSetAtom(overlayWorldAtom);
  const [roomId, reloadId] = useWorldPath();
  const navigatedWorld = useRoom(session, roomId);
  const setEditorEnabled = useSetAtom(editorEnabledAtom);

  /**
   * Handle loading are reloading
   */
  useEffect(() => {
    exitWorld();
    if (navigatedWorld) {
      (async () => {
        try {
          const content = await getWorldContent(navigatedWorld);
          await loadAndEnterWorld(navigatedWorld, content ?? {});
        } catch (err) {
          setError(err as Error);
          console.error(err);
        }
      })();
    }
  }, [navigatedWorld, reloadId, selectWorld, loadAndEnterWorld, exitWorld, setWorld]);

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
   * Reloading via scene state update
   */
  useEffect(() => {
    setError(undefined);

    let dispose: SubscriptionHandle;
    if (navigatedWorld && entered) {
      const handleLoad = async (event: StateEvent | undefined) => {
        const content = event?.content;
        if (!content) return;

        setEditorEnabled(false);

        try {
          await reloadWorld(navigatedWorld, content);
        } catch (err) {
          setError(err as Error);
          console.error(err);
        }
      };
      navigatedWorld.observeStateTypeAndKey("org.matrix.msc3815.world", "").then(async (observable) => {
        dispose = observable.subscribe(handleLoad);
      });
    }

    return () => {
      dispose?.();
    };
  }, [navigatedWorld, entered, isMounted, reloadWorld, setEditorEnabled]);

  return (
    <>
      {navigatedWorld && entered && <WorldView world={navigatedWorld} />}
      <WorldThumbnail />
      {navigatedWorld && <WorldLoading world={navigatedWorld} loading={loading} error={error} />}
    </>
  );
}
