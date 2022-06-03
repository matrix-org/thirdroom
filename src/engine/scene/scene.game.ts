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

interface RemoteScene {
  resourceId: ResourceId;
  sharedScene: TripleBufferBackedObjectBufferView<typeof sceneSchema, ArrayBuffer>;
  get background(): ResourceId;
  set background(texture: ResourceId);
  get environment(): ResourceId;
  set environment(texture: ResourceId);
}

interface SceneModuleState {
  scenes: RemoteScene[];
}

export const SceneModule = defineModule<GameState, SceneModuleState>({
  name: "scene",
  create() {
    return {
      scenes: [],
    };
  },
  init() {},
});

export function SceneUpdateSystem(ctx: GameState) {
  const { scenes } = getModule(ctx, SceneModule);

  for (let i = 0; i < scenes.length; i++) {
    commitToTripleBufferView(scenes[i].sharedScene);
    scenes[i].sharedScene.needsUpdate[0] = 0;
  }
}

export function createScene(ctx: GameState, props?: SceneResourceProps): RemoteScene {
  const sceneModule = getModule(ctx, SceneModule);

  const scene = createObjectBufferView(sceneSchema, ArrayBuffer);

  if (props) {
    scene.background[0] = props.background || 0;
    scene.environment[0] = props.environment || 0;
    scene.needsUpdate[0] = 0;
  }

  const sharedScene = createTripleBufferBackedObjectBufferView(sceneSchema, scene, ctx.gameToMainTripleBufferFlags);

  const resourceId = createResource<SharedSceneResource>(ctx, SceneResourceType, { initialProps: props, sharedScene });

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

  sceneModule.scenes.push(remoteScene);

  return remoteScene;
}
