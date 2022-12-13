import { GameState } from "../GameTypes";
import { RemoteNodeComponent } from "../node/node.game";
import { GLTFNode } from "./GLTF";
import { GLTFResource } from "./gltf.game";
import resolveURL from "../utils/resolveURL";
import { TilesRendererResource } from "../resource/schema";

export function hasTilesRendererExtension(node: GLTFNode) {
  return node.extensions?.MX_tiles_renderer !== undefined;
}

export function addTilesRenderer(ctx: GameState, resource: GLTFResource, nodeIndex: number, nodeEid: number) {
  const node = resource.root.nodes![nodeIndex];
  const remoteNode = RemoteNodeComponent.get(nodeEid);

  if (!node || !remoteNode) {
    return;
  }

  // TODO: rename field to uri
  const tilesetUrl = node.extensions!.MX_tiles_renderer.tilesetUrl;

  remoteNode.tilesRenderer = resource.manager.createResource(TilesRendererResource, {
    uri: resolveURL(tilesetUrl, resource.baseUrl),
  });
}
