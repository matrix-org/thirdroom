import {
  commitToTripleBufferView,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
  TripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { defineModule, getModule } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { createResource, getRemoteResource } from "../resource/resource.game";
import { RemoteTexture } from "../texture/texture.game";
import { SceneResourceProps, SceneResourceType, sceneSchema, SharedSceneResource } from "./scene.common";

export interface RemoteScene {
  resourceId: ResourceId;
  sharedScene: TripleBufferBackedObjectBufferView<typeof sceneSchema, ArrayBuffer>;
  get background(): RemoteTexture | undefined;
  set background(texture: RemoteTexture | undefined);
  get environment(): RemoteTexture | undefined;
  set environment(texture: RemoteTexture | undefined);
}

export interface SceneModuleState {
  sceneResources: Map<number, RemoteScene>;
  scenes: RemoteScene[];
}

export const SceneModule = defineModule<GameState, SceneModuleState>({
  name: "scene",
  create() {
    return {
      sceneResources: new Map(),
      scenes: [],
    };
  },
  init() {},
});

export function SceneUpdateSystem(ctx: GameState) {
  const { scenes } = getModule(ctx, SceneModule);

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    commitToTripleBufferView(scene.sharedScene);
    scene.sharedScene.needsUpdate[0] = 0;
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
    get background(): RemoteTexture | undefined {
      const remoteTextureResource = getRemoteResource<RemoteTexture>(ctx, scene.background[0]);
      return remoteTextureResource?.response;
    },
    set background(texture: RemoteTexture | undefined) {
      scene.background[0] = texture ? texture.resourceId : 0;
      scene.needsUpdate[0] = 1;
    },
    get environment(): RemoteTexture | undefined {
      const remoteTextureResource = getRemoteResource<RemoteTexture>(ctx, scene.environment[0]);
      return remoteTextureResource?.response;
    },
    set environment(texture: RemoteTexture | undefined) {
      scene.environment[0] = texture ? texture.resourceId : 0;
      scene.needsUpdate[0] = 1;
    },
  };

  sceneModule.sceneResources.set(eid, remoteScene);
  sceneModule.scenes.push(remoteScene);

  return remoteScene;
}

export function getSceneResource(ctx: GameState, eid: number): RemoteScene | undefined {
  const sceneModule = getModule(ctx, SceneModule);
  return sceneModule.sceneResources.get(eid);
}
