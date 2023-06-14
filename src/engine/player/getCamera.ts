import { defineComponent, Types } from "bitecs";

import { GameContext } from "../GameTypes";
import { RemoteNode } from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";

export const CameraRef = defineComponent({ eid: Types.eid });

/**
 * Obtains the last added camera on the provided entity if one exists, throws if not
 */
export function getCamera(ctx: GameContext, root: RemoteNode): RemoteNode {
  const cameraEid = CameraRef.eid[root.eid];
  if (!cameraEid) throw new Error(`CameraRef not found on node "${root.name}"`);
  const camera = tryGetRemoteResource<RemoteNode>(ctx, cameraEid);
  return camera;
}
