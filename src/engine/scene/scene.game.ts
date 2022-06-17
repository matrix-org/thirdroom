import { addComponent, defineQuery, exitQuery, removeComponent } from "bitecs";

import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameAudioModule, RemoteGlobalAudioEmitter } from "../audio/audio.game";
import { GameState } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.game";
import { ResourceId } from "../resource/resource.common";
import { createResource, disposeResource } from "../resource/resource.game";
import { RemoteTexture } from "../texture/texture.game";
import {
  audioSceneSchema,
  AudioSceneTripleBuffer,
  AudioSharedSceneResource,
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
  get backgroundTexture(): RemoteTexture | undefined;
  set backgroundTexture(texture: RemoteTexture | undefined);
  get environmentTexture(): RemoteTexture | undefined;
  set environmentTexture(texture: RemoteTexture | undefined);
  get audioEmitters(): RemoteGlobalAudioEmitter[];
  set audioEmitters(emitters: RemoteGlobalAudioEmitter[]);
}

export interface SceneProps {
  audioEmitters?: RemoteGlobalAudioEmitter[];
  backgroundTexture?: RemoteTexture;
  environmentTexture?: RemoteTexture;
}

export function addRemoteSceneComponent(ctx: GameState, eid: number, props?: SceneProps): RemoteScene {
  const rendererModule = getModule(ctx, RendererModule);
  const audioModule = getModule(ctx, GameAudioModule);

  const rendererSceneBufferView = createObjectBufferView(rendererSceneSchema, ArrayBuffer);
  const audioSceneBufferView = createObjectBufferView(audioSceneSchema, ArrayBuffer);

  rendererSceneBufferView.backgroundTexture[0] = props?.backgroundTexture ? props.backgroundTexture.resourceId : 0;
  rendererSceneBufferView.environmentTexture[0] = props?.environmentTexture ? props.environmentTexture.resourceId : 0;

  audioSceneBufferView.audioEmitters.set(props?.audioEmitters ? props.audioEmitters.map((e) => e.resourceId) : []);

  const audioSceneTripleBuffer = createObjectTripleBuffer(audioSceneSchema, ctx.gameToMainTripleBufferFlags);

  const rendererSceneTripleBuffer = createObjectTripleBuffer(rendererSceneSchema, ctx.gameToRenderTripleBufferFlags);

  const rendererResourceId = createResource<RendererSharedSceneResource>(ctx, Thread.Render, SceneResourceType, {
    rendererSceneTripleBuffer,
  });

  const audioResourceId = createResource<AudioSharedSceneResource>(ctx, Thread.Main, SceneResourceType, {
    audioSceneTripleBuffer,
  });

  let _backgroundTexture: RemoteTexture | undefined = props?.backgroundTexture;
  let _environmentTexture: RemoteTexture | undefined = props?.environmentTexture;
  let _audioEmitters: RemoteGlobalAudioEmitter[] = props?.audioEmitters || [];

  const remoteScene: RemoteScene = {
    eid,
    rendererResourceId,
    audioResourceId,
    audioSceneBufferView,
    rendererSceneBufferView,
    audioSceneTripleBuffer,
    rendererSceneTripleBuffer,
    get backgroundTexture(): RemoteTexture | undefined {
      return _backgroundTexture;
    },
    set backgroundTexture(texture: RemoteTexture | undefined) {
      _backgroundTexture = texture;
      rendererSceneBufferView.backgroundTexture[0] = texture ? texture.resourceId : 0;
    },
    get environmentTexture(): RemoteTexture | undefined {
      return _environmentTexture;
    },
    set environmentTexture(texture: RemoteTexture | undefined) {
      _environmentTexture = texture;
      rendererSceneBufferView.environmentTexture[0] = texture ? texture.resourceId : 0;
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

export const RemoteSceneComponent: Map<number, RemoteScene> = new Map();

const remoteSceneQuery = defineQuery([RemoteSceneComponent]);
const remoteSceneExitQuery = exitQuery(remoteSceneQuery);

export function RemoteSceneSystem(ctx: GameState) {
  const rendererModule = getModule(ctx, RendererModule);
  const audioModule = getModule(ctx, GameAudioModule);
  const entities = remoteSceneExitQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    const remoteScene = RemoteSceneComponent.get(eid);

    if (remoteScene) {
      disposeResource(ctx, remoteScene.rendererResourceId);
      disposeResource(ctx, remoteScene.audioResourceId);

      const rendererIndex = rendererModule.scenes.indexOf(remoteScene);

      if (rendererIndex !== -1) {
        rendererModule.scenes.splice(rendererIndex, 1);
      }

      const audioIndex = audioModule.scenes.indexOf(remoteScene);

      if (audioIndex !== -1) {
        audioModule.scenes.splice(audioIndex, 1);
      }

      RemoteSceneComponent.delete(eid);
    }
  }
}

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
