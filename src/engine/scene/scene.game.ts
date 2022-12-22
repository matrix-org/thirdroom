import { addComponent, defineQuery, exitQuery } from "bitecs";
import { mat4, quat, vec3 } from "gl-matrix";

import { Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import {
  disposeResource,
  RemoteAudioEmitter,
  RemoteNode,
  RemoteReflectionProbe,
  RemoteScene,
  RemoteTexture,
} from "../resource/resource.game";
import { IRemoteResourceManager } from "../resource/ResourceDefinition";

interface SceneProps {
  backgroundTexture?: RemoteTexture;
  reflectionProbe?: RemoteReflectionProbe;
  audioEmitters?: RemoteAudioEmitter[];
  firstNode?: RemoteNode;
}

export function addRemoteSceneComponent(
  ctx: GameState,
  eid: number,
  props: SceneProps = {},
  resourceManager: IRemoteResourceManager = ctx.resourceManager
): RemoteScene {
  const remoteScene = new RemoteScene(resourceManager, { ...props, eid });

  addComponent(ctx.world, RemoteSceneComponent, eid);

  RemoteSceneComponent.set(eid, remoteScene);

  addComponent(ctx.world, Transform, eid);
  vec3.set(Transform.position[eid], 0, 0, 0);
  vec3.set(Transform.scale[eid], 1, 1, 1);
  quat.identity(Transform.quaternion[eid]);
  mat4.identity(Transform.localMatrix[eid]);
  Transform.isStatic[eid] = 0;
  mat4.identity(Transform.worldMatrix[eid]);
  Transform.worldMatrixNeedsUpdate[eid] = 1;
  Transform.parent[eid] = 0;
  Transform.firstChild[eid] = 0;
  Transform.nextSibling[eid] = 0;
  Transform.prevSibling[eid] = 0;

  // always skip lerp for first few frames of existence
  Transform.skipLerp[eid] = 10;

  return remoteScene;
}

export const RemoteSceneComponent: Map<number, RemoteScene> = new Map();

const remoteSceneQuery = defineQuery([RemoteSceneComponent]);
const remoteSceneExitQuery = exitQuery(remoteSceneQuery);

export function RemoteSceneSystem(ctx: GameState) {
  const entities = remoteSceneExitQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    const remoteScene = RemoteSceneComponent.get(eid);

    if (remoteScene) {
      disposeResource(ctx, remoteScene.resourceId);
      RemoteSceneComponent.delete(eid);
    }
  }
}
