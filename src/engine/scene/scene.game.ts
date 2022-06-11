import { addComponent, defineComponent, removeComponent } from "bitecs";

import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameAudioModule, RemoteGlobalAudioEmitter } from "../audio/audio.game";
import { NOOP } from "../config.common";
import { GameState } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
import { RemoteNode } from "../node/node.game";
import { RendererModule } from "../renderer/renderer.game";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import { RemoteTexture } from "../texture/texture.game";
import {
  AudioSceneResourceProps,
  audioSceneSchema,
  AudioSceneTripleBuffer,
  AudioSharedSceneResource,
  RendererSceneResourceProps,
  rendererSceneSchema,
  RendererSceneTripleBuffer,
  RendererSharedSceneResource,
  SceneResourceType,
} from "./scene.common";

export type RendererSceneBufferView = ObjectBufferView<typeof rendererSceneSchema, ArrayBuffer>;
export type AudioSceneBufferView = ObjectBufferView<typeof audioSceneSchema, ArrayBuffer>;

export interface RemoteScene {
  eid: number;
  rendererResourceId: ResourceId;
  audioResourceId: ResourceId;
  audioSceneBufferView: AudioSceneBufferView;
  rendererSceneBufferView: RendererSceneBufferView;
  audioSceneTripleBuffer: AudioSceneTripleBuffer;
  rendererSceneTripleBuffer: RendererSceneTripleBuffer;
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

export function addRemoteSceneComponent(ctx: GameState, eid: number, props?: SceneProps): RemoteScene {
  const rendererModule = getModule(ctx, RendererModule);
  const audioModule = getModule(ctx, GameAudioModule);

  const rendererSceneBufferView = createObjectBufferView(rendererSceneSchema, ArrayBuffer);
  const audioSceneBufferView = createObjectBufferView(audioSceneSchema, ArrayBuffer);

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

    initialAudioProps.audioListener = props.audioListener ? props.audioListener.audioResourceId : 0;
    initialAudioProps.audioEmitters = props.audioEmitters ? props.audioEmitters.map((e) => e.resourceId) : [];

    rendererSceneBufferView.background[0] = initialRendererProps.background;
    rendererSceneBufferView.environment[0] = initialRendererProps.environment;

    audioSceneBufferView.audioListener[0] = props.audioListener ? props.audioListener.audioResourceId : 0;
    audioSceneBufferView.audioEmitters.set(initialAudioProps.audioEmitters);

    if (props.audioEmitters) {
      audioSceneBufferView.audioEmitters.set(props.audioEmitters.map((e) => e.resourceId));
    }
  }

  const audioSceneTripleBuffer = createObjectTripleBuffer(audioSceneSchema, ctx.gameToMainTripleBufferFlags);

  const rendererSceneTripleBuffer = createObjectTripleBuffer(rendererSceneSchema, ctx.gameToRenderTripleBufferFlags);

  const rendererResourceId = createResource<RendererSharedSceneResource>(ctx, Thread.Render, SceneResourceType, {
    initialProps: initialRendererProps,
    rendererSceneTripleBuffer,
  });

  const audioResourceId = createResource<AudioSharedSceneResource>(ctx, Thread.Main, SceneResourceType, {
    initialProps: initialAudioProps,
    audioSceneTripleBuffer,
  });

  let _background: RemoteTexture | undefined = props?.background;
  let _environment: RemoteTexture | undefined = props?.environment;
  let _audioListener: RemoteNode | undefined = props?.audioListener;
  let _audioEmitters: RemoteGlobalAudioEmitter[] = props?.audioEmitters || [];

  const remoteScene: RemoteScene = {
    eid,
    rendererResourceId,
    audioResourceId,
    audioSceneBufferView,
    rendererSceneBufferView,
    audioSceneTripleBuffer,
    rendererSceneTripleBuffer,
    get background(): RemoteTexture | undefined {
      return _background;
    },
    set background(texture: RemoteTexture | undefined) {
      _background = texture;
      rendererSceneBufferView.background[0] = texture ? texture.resourceId : 0;
    },
    get environment(): RemoteTexture | undefined {
      return _environment;
    },
    set environment(texture: RemoteTexture | undefined) {
      _environment = texture;
      rendererSceneBufferView.environment[0] = texture ? texture.resourceId : 0;
    },
    get audioListener(): RemoteNode | undefined {
      return _audioListener;
    },
    set audioListener(node: RemoteNode | undefined) {
      _audioListener = node;
      audioSceneBufferView.audioListener[0] = node?.audioResourceId || 0;
    },
    get audioEmitters(): RemoteGlobalAudioEmitter[] {
      return _audioEmitters;
    },
    set audioEmitters(emitters: RemoteGlobalAudioEmitter[]) {
      _audioEmitters = emitters;
      audioSceneBufferView.audioEmitters.set(emitters.map((e) => e.resourceId));
    },
  };

  rendererModule.scenes.push(remoteScene);
  audioModule.scenes.push(remoteScene);

  addComponent(ctx.world, RemoteSceneComponent, eid);
  RemoteSceneComponent.set(eid, remoteScene);

  return remoteScene;
}

export const RemoteSceneComponent = defineComponent<Map<number, RemoteScene>>(new Map());

export function removeRemoteSceneComponent(ctx: GameState, eid: number) {
  removeComponent(ctx.world, RemoteSceneComponent, eid);
  RemoteSceneComponent.delete(eid);
}

export function updateRendererRemoteScenes(scenes: RemoteScene[]) {
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    commitToObjectTripleBuffer(scene.rendererSceneTripleBuffer, scene.rendererSceneBufferView);
  }
}

export function updateAudioRemoteScenes(scenes: RemoteScene[]) {
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    commitToObjectTripleBuffer(scene.audioSceneTripleBuffer, scene.audioSceneBufferView);
  }
}
