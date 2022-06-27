import { createRemoteTilesRenderer } from "../tiles-renderer/tiles-renderer.game";
import { GameState } from "../GameTypes";
import { RemoteNodeComponent } from "../node/node.game";
//import resolveURL from "../utils/resolveURL";
import { GLTFNode } from "./GLTF";
import { GLTFResource } from "./gltf.game";

export function hasTilesRendererExtension(node: GLTFNode) {
  return node.extensions?.MX_tiles_renderer !== undefined;
}

export function addTilesRenderer(ctx: GameState, resource: GLTFResource, nodeIndex: number, nodeEid: number) {
  const node = resource.root.nodes![nodeIndex];
  const remoteNode = RemoteNodeComponent.get(nodeEid);

  if (!node || !remoteNode) {
    return;
  }

  remoteNode.tilesRenderer = createRemoteTilesRenderer(ctx, "/gltf/mars/tiles/scene-tileset.json");
}
