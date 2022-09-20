import { addPortalComponent } from "../../plugins/portals/portals.game";
import { GameState } from "../GameTypes";
import { GLTFNode } from "./GLTF";

export function inflatePortalComponent(ctx: GameState, node: GLTFNode, nodeEid: number) {
  const extension = node.extensions?.MX_portal;

  if (!extension) {
    return;
  }

  console.log("add portal component", extension);

  addPortalComponent(ctx.world, nodeEid, { uri: extension.uri });
}
