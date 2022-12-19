import { addComponent, defineQuery, exitQuery, removeComponent } from "bitecs";

import { GameState } from "../GameTypes";
import { disposeResource } from "../resource/resource.game";
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
