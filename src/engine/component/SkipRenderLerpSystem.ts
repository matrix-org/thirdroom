import { defineQuery } from "bitecs";

import { GameState } from "../GameTypes";
import { RemoteNode } from "../resource/RemoteResources";
import { getRemoteResource } from "../resource/resource.game";

const skipRenderLerpQuery = defineQuery([RemoteNode]);

export function SkipRenderLerpSystem(ctx: GameState) {
  const ents = skipRenderLerpQuery(ctx.world);

  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const node = getRemoteResource<RemoteNode>(ctx, eid)!;

    node.skipLerp -= 1;

    if (node.skipLerp <= 0) {
      node.skipLerp = 0;
    }
  }
}
