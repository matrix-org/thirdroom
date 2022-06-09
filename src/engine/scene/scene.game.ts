import { addComponent, defineComponent, removeComponent } from "bitecs";

import {
  commitToTripleBufferView,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameAudioModule, RemoteGlobalAudioEmitter } from "../audio/audio.game";
import { NOOP } from "../config.common";
import { GameState } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.game";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import { RemoteTexture } from "../texture/texture.game";
import {
  AudioSceneResourceProps,
  audioSceneSchema,
  AudioSharedScene,
  AudioSharedSceneResource,
  RendererSceneResourceProps,
  rendererSceneSchema,
  RendererSharedScene,
  RendererSharedSceneResource,
  SceneResourceType,
} from "./scene.common";

export interface RemoteScene {
  rendererResourceId: ResourceId;
  audioResourceId: ResourceId;
  rendererSharedScene: RendererSharedScene;
  audioSharedScene: AudioSharedScene;
  get background(): RemoteTexture | undefined;
  set background(texture: RemoteTexture | undefined);
  get environment(): RemoteTexture | undefined;
  set environment(texture: RemoteTexture | undefined);
  get audioListener(): RemoteNode | undefined;
  set audioListener(node: RemoteNode | undefined);
  get audioEmitters(): RemoteGlobalAudioEmitter[];
  set audioEmitters(emitters: RemoteGlobalAudioEmitter[]);
}

export interface SceneProps {
  audioListener?: RemoteNode;
  audioEmitters?: RemoteGlobalAudioEmitter[];
  background?: RemoteTexture;
  environment?: RemoteTexture;
}

export function createRemoteSceneResource(ctx: GameState, props?: SceneProps): RemoteScene {
  const rendererModule = getModule(ctx, RendererModule);
  const audioModule = getModule(ctx, GameAudioModule);

  const rendererScene = createObjectBufferView(rendererSceneSchema, ArrayBuffer);
  const audioScene = createObjectBufferView(audioSceneSchema, ArrayBuffer);

  const initialRendererProps: RendererSceneResourceProps = {
    background: 0,
    environment: 0,
  };

  const initialAudioProps: AudioSceneResourceProps = {
    audioListener: NOOP,
    audioEmitters: [],
  };

  if (props) {
    initialRendererProps.background = props.background ? props.background.resourceId : 0;
    initialRendererProps.environment = props.environment ? props.environment.resourceId : 0;

    initialAudioProps.audioListener = props.audioListener ? props.audioListener.resourceId : 0;
    initialAudioProps.audioEmitters = props.audioEmitters ? props.audioEmitters.map((e) => e.resourceId) : [];

    rendererScene.background[0] = initialRendererProps.background;
    rendererScene.environment[0] = initialRendererProps.environment;
    rendererScene.needsUpdate[0] = 0;

    audioScene.audioListener[0] = props.audioListener ? props.audioListener.resourceId : 0;
    audioScene.audioEmitters.set(initialAudioProps.audioEmitters);

    if (props.audioEmitters) {
      audioScene.audioEmitters.set(props.audioEmitters.map((e) => e.resourceId));
    }
  }

  const audioSharedScene = createTripleBufferBackedObjectBufferView(
    audioSceneSchema,
    audioScene,
    ctx.gameToMainTripleBufferFlags
  );

  const rendererSharedScene = createTripleBufferBackedObjectBufferView(
    rendererSceneSchema,
    rendererScene,
    ctx.gameToRenderTripleBufferFlags
  );

  const rendererResourceId = createResource<RendererSharedSceneResource>(ctx, Thread.Render, SceneResourceType, {
    initialProps: initialRendererProps,
    sharedScene: rendererSharedScene,
  });

  const audioResourceId = createResource<AudioSharedSceneResource>(ctx, Thread.Main, SceneResourceType, {
    initialProps: initialAudioProps,
    sharedScene: audioSharedScene,
  });

  let _background: RemoteTexture | undefined = props?.background;
  let _environment: RemoteTexture | undefined = props?.environment;
  let _audioListener: RemoteNode | undefined = props?.audioListener;
  let _audioEmitters: RemoteGlobalAudioEmitter[] = props?.audioEmitters || [];

  const remoteScene: RemoteScene = {
    rendererResourceId,
    audioResourceId,
    audioSharedScene,
    rendererSharedScene,
    get background(): RemoteTexture | undefined {
      return _background;
    },
    set background(texture: RemoteTexture | undefined) {
      _background = texture;
      rendererScene.background[0] = texture ? texture.resourceId : 0;
      rendererScene.needsUpdate[0] = 1;
    },
    get environment(): RemoteTexture | undefined {
      return _environment;
    },
    set environment(texture: RemoteTexture | undefined) {
      _environment = texture;
      rendererScene.environment[0] = texture ? texture.resourceId : 0;
      rendererScene.needsUpdate[0] = 1;
    },
    get audioListener(): RemoteNode | undefined {
      return _audioListener;
    },
    set audioListener(node: RemoteNode | undefined) {
      _audioListener = node;
      audioScene.audioListener[0] = node.resourceId;
    },
    get audioEmitters(): RemoteGlobalAudioEmitter[] {
      return _audioEmitters;
    },
    set audioEmitters(emitters: RemoteGlobalAudioEmitter[]) {
      _audioEmitters = emitters;
      audioScene.audioEmitters.set(emitters.map((e) => e.resourceId));
    },
  };

  rendererModule.scenes.push(remoteScene);
  audioModule.scenes.push(remoteScene);

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

export function updateRendererRemoteScenes(scenes: RemoteScene[]) {
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    commitToTripleBufferView(scene.rendererSharedScene);
    scene.rendererSharedScene.needsUpdate[0] = 0;
  }
}

export function updateAudioRemoteScenes(scenes: RemoteScene[]) {
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    commitToTripleBufferView(scene.audioSharedScene);
  }
}
