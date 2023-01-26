import { useHydrogen } from "../../../hooks/useHydrogen";
import { useStore } from "../../../hooks/useStore";
import { useWorldPath } from "../../../hooks/useWorld";
import { WorldLoading } from "./WorldLoading";
import { WorldThumbnail } from "./WorldThumbnail";
import { WorldView } from "./WorldView";

export default function WorldRootView() {
  const { session } = useHydrogen(true);
  const { worldId, entered } = useStore((state) => state.world);
  const world = worldId ? session.rooms.get(worldId) : undefined;

  const [roomId, reloadId] = useWorldPath();

  return (
    <>
      {world && entered && <WorldView world={world} />}
      <WorldThumbnail />
      <WorldLoading roomId={roomId} reloadId={reloadId} />
    </>
  );
}
