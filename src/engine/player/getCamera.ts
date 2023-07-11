import { defineComponent, Types } from "bitecs";

import { GameContext } from "../GameTypes";
import { RemoteNode } from "../resource/RemoteResources";
import { getRemoteResource, tryGetRemoteResource } from "../resource/resource.game";

export const CameraRef = defineComponent({ eid: Types.eid });

export function tryGetCamera(ctx: GameContext, root: RemoteNode): RemoteNode {
  const cameraEid = CameraRef.eid[root.eid];
  if (!cameraEid) throw new Error(`CameraRef not found on node "${root.name}"`);
  const camera = tryGetRemoteResource<RemoteNode>(ctx, cameraEid);
  return camera;
}

export function getCamera(ctx: GameContext, root: RemoteNode): RemoteNode | undefined {
  const cameraEid = CameraRef.eid[root.eid];
  return getRemoteResource<RemoteNode>(ctx, cameraEid);
}
