import { addComponent, addEntity, defineQuery, exitQuery, removeComponent } from "bitecs";

import { TripleBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { GameNodeResource } from "../node/node.game";
import { defineRemoteResourceClass } from "../resource/RemoteResourceClass";
import { disposeResource } from "../resource/resource.game";
import { InitialResourceProps, IRemoteResourceManager } from "../resource/ResourceDefinition";
import {
  RemoteAudioEmitter,
  RemoteReflectionProbe,
  RemoteScene,
  RemoteTexture,
  SceneResource,
} from "../resource/schema";

export interface SceneProps {
  name?: string;
  audioEmitters?: RemoteAudioEmitter[];
  backgroundTexture?: RemoteTexture;
  reflectionProbe?: RemoteReflectionProbe;
  bloomStrength?: number;
}

export class GameSceneResource extends defineRemoteResourceClass<typeof SceneResource>(SceneResource) {
  declare firstNode: GameNodeResource;

  constructor(
    manager: IRemoteResourceManager,
    ctx: GameState,
    buffer: ArrayBuffer,
    ptr: number,
    tripleBuffer: TripleBuffer,
    props?: InitialResourceProps<typeof SceneResource>
  ) {
    super(manager, ctx, buffer, ptr, tripleBuffer, props);
    this.__props["id"][0] = props?.id || addEntity(ctx.world);
  }
}

export function addRemoteSceneComponent(ctx: GameState, eid: number, props?: SceneProps): RemoteScene {
  const remoteScene = ctx.resourceManager.createResource(SceneResource, props || {});
  addComponent(ctx.world, RemoteSceneComponent, eid);
  RemoteSceneComponent.set(eid, remoteScene);
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

export function removeRemoteSceneComponent(ctx: GameState, eid: number) {
  removeComponent(ctx.world, RemoteSceneComponent, eid);
  RemoteSceneComponent.delete(eid);
}
