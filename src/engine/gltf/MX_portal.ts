import { addPortalComponent } from "../../plugins/portals/portals.game";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { PhysicsModule } from "../physics/physics.game";
import { GLTFNode } from "./GLTF";

export function inflatePortalComponent(ctx: GameState, node: GLTFNode, nodeEid: number) {
  const extension = node.extensions?.MX_portal;

  if (!extension) {
    return;
  }

  const physics = getModule(ctx, PhysicsModule);
  addPortalComponent(ctx, physics, nodeEid, { uri: extension.uri });
}
