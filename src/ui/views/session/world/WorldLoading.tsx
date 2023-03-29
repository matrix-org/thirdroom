import { useCallback, useEffect, useState } from "react";
import { Room } from "@thirdroom/hydrogen-view-sdk";
import { useAtom } from "jotai";

import { IMainThreadContext } from "../../../../engine/MainThread";
import { registerMessageHandler } from "../../../../engine/module/module.common";
import { FetchProgressMessage, FetchProgressMessageType } from "../../../../engine/utils/fetchWithProgress.game";
import { Progress } from "../../../atoms/progress/Progress";
import { Text } from "../../../atoms/text/Text";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { bytesToSize, getPercentage } from "../../../utils/common";
import "./WorldLoading.css";
import { Button } from "../../../atoms/button/Button";
import { WorldPreviewCard } from "../../components/world-preview-card/WorldPreviewCard";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { useWorldLoader } from "../../../hooks/useWorldLoader";

interface WorldLoadProgress {
  loaded: number;
  total: number;
}

function useWorldLoadingProgress(): [() => void, WorldLoadProgress] {
  const engine = useMainThreadContext();
  const [loadProgress, setLoadProgress] = useState<WorldLoadProgress>({ loaded: 0, total: 0 });

  useEffect(() => {
    const onFetchProgress = (ctx: IMainThreadContext, message: FetchProgressMessage) => {
      setLoadProgress(message.status);
    };
    return registerMessageHandler(engine, FetchProgressMessageType, onFetchProgress);
  }, [engine]);

  const reset = useCallback(() => {
    setLoadProgress({ loaded: 0, total: 0 });
  }, []);

  return [reset, loadProgress];
}

export function WorldLoading({ world, loading, error }: { world: Room; loading: boolean; error?: Error }) {
  const [overlayVisible] = useAtom(overlayVisibilityAtom);
  const [resetLoadProgress, loadProgress] = useWorldLoadingProgress();
  const [creator, setCreator] = useState<string>();
  const { enterWorld } = useWorldLoader();
  useEffect(() => {
    resetLoadProgress();
  }, [resetLoadProgress, loading]);

  useEffect(() => {
    let disposed = false;
    world?.getStateEvent("m.room.create", "").then((stateEvent) => {
      if (disposed) return;
      const creatorId = stateEvent?.event.sender;
      if (!creatorId) return;
      setCreator(creatorId);
    });
    return () => {
      disposed = true;
    };
  }, [world]);

  if (overlayVisible) return null;

  return (
    <>
      {error && (
        <div className="WorldLoading flex justify-center">
          <WorldPreviewCard
            title={world.name ?? world.canonicalAlias ?? "Unknown World"}
            desc={error.message}
            options={<Button onClick={() => enterWorld(world, { reload: true })}>Reload</Button>}
          />
        </div>
      )}
      {loading && (
        <div className="WorldLoading flex justify-center">
          <WorldPreviewCard
            title={world.name ?? world.canonicalAlias ?? "Unknown World"}
            desc={creator ? `Created by ${creator}` : undefined}
            content={
              <div className="flex flex-column gap-xs">
                <Progress
                  variant="secondary"
                  max={100}
                  value={getPercentage(loadProgress.total, loadProgress.loaded)}
                />
                <div className="flex justify-between gap-md">
                  <Text variant="b3">{`Loading Scene: ${getPercentage(
                    loadProgress.total,
                    loadProgress.loaded
                  )}%`}</Text>
                  <Text variant="b3">{`${bytesToSize(loadProgress.loaded)} / ${bytesToSize(loadProgress.total)}`}</Text>
                </div>
              </div>
            }
          />
        </div>
      )}
    </>
  );
}
