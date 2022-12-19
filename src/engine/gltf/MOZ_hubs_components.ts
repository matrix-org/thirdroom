import { addComponent } from "bitecs";
import { quat } from "gl-matrix";

import { createRemotePerspectiveCamera } from "../camera/camera.game";
import { SpawnPoint } from "../component/SpawnPoint";
import { GameState } from "../GameTypes";
import { RemoteNode } from "../resource/schema";
import { GLTFRoot } from "./GLTF";
import { GLTFResource } from "./gltf.game";
import { addTrimesh } from "./OMI_collider";

export function hasHubsComponentsExtension(root: GLTFRoot) {
  return root.extensions?.MOZ_hubs_components !== undefined;
}

export function inflateHubsScene(ctx: GameState, resource: GLTFResource, sceneIndex: number, sceneEid: number) {}

export function inflateHubsNode(ctx: GameState, resource: GLTFResource, nodeIndex: number, remoteNode: RemoteNode) {
  const node = resource.root.nodes![nodeIndex];
  const components = node.extensions?.MOZ_hubs_components;

  if (!components) {
    return;
  }

  if (components["spawn-point"] || components["waypoint"]?.canBeSpawnPoint) {
    remoteNode.position[1] += 1.6;
    quat.rotateY(remoteNode.quaternion, remoteNode.quaternion, Math.PI);
    addComponent(ctx.world, SpawnPoint, remoteNode.resourceId);
  }

  if (components["trimesh"] || components["nav-mesh"]) {
    addTrimesh(ctx, remoteNode);
  }

  if (components.visible?.visible === false) {
    remoteNode.visible = false;
  }

  if (components["scene-preview-camera"]) {
    remoteNode.camera = createRemotePerspectiveCamera(ctx);
    ctx.activeCamera = remoteNode;
  }
}
