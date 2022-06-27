import { GLTFNode } from "./GLTF";

export function hasSpawnPointExtension(node: GLTFNode) {
  return node.extensions?.MX_spawn_point !== undefined;
}
