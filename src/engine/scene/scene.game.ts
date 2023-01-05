import { addComponent, defineQuery, exitQuery } from "bitecs";

import { GameState } from "../GameTypes";
import {
  RemoteAudioEmitter,
  RemoteNode,
  RemoteReflectionProbe,
  RemoteScene,
  RemoteTexture,
} from "../resource/resource.game";
import { IRemoteResourceManager } from "../resource/ResourceDefinition";

interface SceneProps {
  name?: string;
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
      remoteScene.dispose();
      RemoteSceneComponent.delete(eid);
    }
  }
}
