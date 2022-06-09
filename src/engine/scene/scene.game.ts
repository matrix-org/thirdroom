import { addComponent, defineComponent, removeComponent } from "bitecs";

import {
  commitToTripleBufferView,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
  TripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.game";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
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

export function createRemoteSceneResource(ctx: GameState, props?: SceneResourceProps): RemoteScene {
  const rendererModule = getModule(ctx, RendererModule);

  const scene = createObjectBufferView(sceneSchema, ArrayBuffer);

  if (props) {
    scene.background[0] = props.background || 0;
    scene.environment[0] = props.environment || 0;
    scene.needsUpdate[0] = 0;
  }

  const sharedScene = createTripleBufferBackedObjectBufferView(sceneSchema, scene, ctx.gameToMainTripleBufferFlags);

  const resourceId = createResource<SharedSceneResource>(ctx, Thread.Render, SceneResourceType, {
    initialProps: props,
    sharedScene,
  });

  let _background: RemoteTexture | undefined;
  let _environment: RemoteTexture | undefined;

  const remoteScene: RemoteScene = {
    resourceId,
    sharedScene,
    get background(): RemoteTexture | undefined {
      return _background;
    },
    set background(texture: RemoteTexture | undefined) {
      _background = texture;
      scene.background[0] = texture ? texture.resourceId : 0;
      scene.needsUpdate[0] = 1;
    },
    get environment(): RemoteTexture | undefined {
      return _environment;
    },
    set environment(texture: RemoteTexture | undefined) {
      _environment = texture;
      scene.environment[0] = texture ? texture.resourceId : 0;
      scene.needsUpdate[0] = 1;
    },
  };

  rendererModule.scenes.push(remoteScene);

  return remoteScene;
}

export const RemoteSceneComponent = defineComponent<Map<number, RemoteScene>>(new Map());

export function addRemoteSceneComponent(ctx: GameState, eid: number, scene: RemoteScene) {
  addComponent(ctx.world, RemoteSceneComponent, eid);
  RemoteSceneComponent.set(eid, scene);
}

export function removeRemoteSceneComponent(ctx: GameState, eid: number) {
  removeComponent(ctx.world, RemoteSceneComponent, eid);
  RemoteSceneComponent.delete(eid);
}

export function updateRemoteScenes(scenes: RemoteScene[]) {
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    commitToTripleBufferView(scene.sharedScene);
    scene.sharedScene.needsUpdate[0] = 0;
  }
}
