import { addComponent, defineQuery, exitQuery } from "bitecs";

import { GameState } from "../GameTypes";
import { disposeResource } from "../resource/resource.game";
import { InitialResourceProps, IRemoteResourceManager } from "../resource/ResourceDefinition";
import { RemoteScene, SceneResource } from "../resource/schema";

export function addRemoteSceneComponent(
  ctx: GameState,
  eid: number,
  props: Omit<InitialResourceProps<typeof SceneResource>, "eid"> = {},
  resourceManager: IRemoteResourceManager = ctx.resourceManager
): RemoteScene {
  const remoteScene = resourceManager.createResource(SceneResource, { ...props, eid });

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
