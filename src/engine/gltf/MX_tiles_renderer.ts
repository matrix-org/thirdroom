import { createRemoteTilesRenderer } from "../tiles-renderer/tiles-renderer.game";
import { GameState } from "../GameTypes";
import { RemoteNodeComponent } from "../node/node.game";
import { GLTFNode } from "./GLTF";
import { GLTFResource } from "./gltf.game";
import resolveURL from "../utils/resolveURL";

export function hasTilesRendererExtension(node: GLTFNode) {
  return node.extensions?.MX_tiles_renderer !== undefined;
}

export function addTilesRenderer(ctx: GameState, resource: GLTFResource, nodeIndex: number, nodeEid: number) {
  const node = resource.root.nodes![nodeIndex];
  const remoteNode = RemoteNodeComponent.get(nodeEid);

  if (!node || !remoteNode) {
    return;
  }

  const tilesetUrl = node.extensions!.MX_tiles_renderer.tilesetUrl;

  remoteNode.tilesRenderer = createRemoteTilesRenderer(ctx, { tilesetUrl: resolveURL(tilesetUrl, resource.baseUrl) });
}
