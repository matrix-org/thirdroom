import {
  commitToTripleBufferView,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
  TripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { defineModule, getModule } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import { SceneResourceProps, SceneResourceType, sceneSchema, SharedSceneResource } from "./scene.common";

export interface RemoteScene {
  resourceId: ResourceId;
  sharedScene: TripleBufferBackedObjectBufferView<typeof sceneSchema, ArrayBuffer>;
  get background(): ResourceId;
  set background(texture: ResourceId);
  get environment(): ResourceId;
  set environment(texture: ResourceId);
}

export interface SceneModuleState {
  sceneResources: Map<number, RemoteScene>;
}

export const SceneModule = defineModule<GameState, SceneModuleState>({
  name: "scene",
  create() {
    return {
      sceneResources: new Map(),
    };
  },
  init() {},
});

export function SceneUpdateSystem(ctx: GameState) {
  const { sceneResources } = getModule(ctx, SceneModule);

  for (const [, remoteScene] of sceneResources) {
    commitToTripleBufferView(remoteScene.sharedScene);
    remoteScene.sharedScene.needsUpdate[0] = 0;
  }
}

export function addSceneResource(ctx: GameState, eid: number, props?: SceneResourceProps): RemoteScene {
  const sceneModule = getModule(ctx, SceneModule);

  const scene = createObjectBufferView(sceneSchema, ArrayBuffer);

  if (props) {
    scene.background[0] = props.background || 0;
    scene.environment[0] = props.environment || 0;
    scene.needsUpdate[0] = 0;
  }

  const sharedScene = createTripleBufferBackedObjectBufferView(sceneSchema, scene, ctx.gameToMainTripleBufferFlags);

  const resourceId = createResource<SharedSceneResource>(ctx, SceneResourceType, {
    eid,
    initialProps: props,
    sharedScene,
  });

  const remoteScene: RemoteScene = {
    resourceId,
    sharedScene,
    get background(): ResourceId {
      return scene.background[0];
    },
    set background(texture: ResourceId) {
      scene.background[0] = texture;
      scene.needsUpdate[0] = 1;
    },
    get environment(): ResourceId {
      return scene.environment[0];
    },
    set environment(texture: ResourceId) {
      scene.environment[0] = texture;
      scene.needsUpdate[0] = 1;
    },
  };

  sceneModule.sceneResources.set(eid, remoteScene);

  return remoteScene;
}

export function getSceneResource(ctx: GameState, eid: number): RemoteScene | undefined {
  const sceneModule = getModule(ctx, SceneModule);
  return sceneModule.sceneResources.get(eid);
}
