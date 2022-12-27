import { GameState } from "../GameTypes";
import { RemoteNodeComponent } from "../node/node.game";
import { GLTFNode } from "./GLTF";
import { GLTFResource } from "./gltf.game";
import resolveURL from "../utils/resolveURL";
import { RemoteTilesRenderer } from "../resource/resource.game";

export function hasTilesRendererExtension(node: GLTFNode) {
  return node.extensions?.MX_tiles_renderer !== undefined;
}

export function addTilesRenderer(ctx: GameState, resource: GLTFResource, nodeIndex: number, nodeEid: number) {
  if (!resource.root.nodes) {
    return;
  }

  const node = resource.root.nodes[nodeIndex];
  const remoteNode = RemoteNodeComponent.get(nodeEid);

  if (!node || !remoteNode) {
    return;
  }

  // TODO: rename field to uri
  const tilesetUrl = node.extensions?.MX_tiles_renderer?.tilesetUrl;

  if (!tilesetUrl) {
    return;
  }

  remoteNode.tilesRenderer = new RemoteTilesRenderer(resource.manager, {
    uri: resolveURL(tilesetUrl, resource.baseUrl),
  });
}
