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
import { RemoteReflectionProbe } from "../reflection-probe/reflection-probe.game";
import { RendererModule } from "../renderer/renderer.game";
import { ResourceId } from "../resource/resource.common";
import { addResourceRef, createResource, disposeResource } from "../resource/resource.game";
import { RemoteTexture } from "../resource/schema";
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

const DEFAULT_SCENE_NAME = "Scene";

export interface RemoteScene {
  name: string;
  eid: number;
  rendererResourceId: ResourceId;
  audioResourceId: ResourceId;
  audioSceneBufferView: AudioSceneBufferView;
  rendererSceneBufferView: RendererSceneBufferView;
  audioSceneTripleBuffer: AudioSceneTripleBuffer;
  rendererSceneTripleBuffer: RendererSceneTripleBuffer;
  get backgroundTexture(): RemoteTexture | undefined;
  set backgroundTexture(texture: RemoteTexture | undefined);
  get reflectionProbe(): RemoteReflectionProbe | undefined;
  set reflectionProbe(reflectionProbe: RemoteReflectionProbe | undefined);
  get audioEmitters(): RemoteGlobalAudioEmitter[];
  set audioEmitters(emitters: RemoteGlobalAudioEmitter[]);
  // TODO: move to postprocessing resource
  get bloomStrength(): number;
  set bloomStrength(value: number);
}

export interface SceneProps {
  name?: string;
  audioEmitters?: RemoteGlobalAudioEmitter[];
  backgroundTexture?: RemoteTexture;
  reflectionProbe?: RemoteReflectionProbe;
  bloomStrength?: number;
}

export function addRemoteSceneComponent(ctx: GameState, eid: number, props?: SceneProps): RemoteScene {
  const rendererModule = getModule(ctx, RendererModule);
  const audioModule = getModule(ctx, GameAudioModule);

  const rendererSceneBufferView = createObjectBufferView(rendererSceneSchema, ArrayBuffer);
  const audioSceneBufferView = createObjectBufferView(audioSceneSchema, ArrayBuffer);

  rendererSceneBufferView.backgroundTexture[0] = props?.backgroundTexture ? props.backgroundTexture.resourceId : 0;
  rendererSceneBufferView.reflectionProbe[0] = props?.reflectionProbe ? props.reflectionProbe.resourceId : 0;
  rendererSceneBufferView.bloomStrength[0] = props?.bloomStrength !== undefined ? props.bloomStrength : 0.4;

  audioSceneBufferView.audioEmitters.set(props?.audioEmitters ? props.audioEmitters.map((e) => e.resourceId) : []);

  const audioSceneTripleBuffer = createObjectTripleBuffer(audioSceneSchema, ctx.gameToMainTripleBufferFlags);

  const rendererSceneTripleBuffer = createObjectTripleBuffer(rendererSceneSchema, ctx.gameToRenderTripleBufferFlags);

  let _backgroundTexture: RemoteTexture | undefined = props?.backgroundTexture;
  let _reflectionProbe: RemoteReflectionProbe | undefined = props?.reflectionProbe;
  let _audioEmitters: RemoteGlobalAudioEmitter[] = props?.audioEmitters || [];

  const name = props?.name || DEFAULT_SCENE_NAME;

  const rendererResourceId = createResource<RendererSharedSceneResource>(
    ctx,
    Thread.Render,
    SceneResourceType,
    {
      rendererSceneTripleBuffer,
    },
    {
      name,
      dispose() {
        if (_backgroundTexture) {
          disposeResource(ctx, _backgroundTexture.resourceId);
        }

        if (_reflectionProbe) {
          disposeResource(ctx, _reflectionProbe.resourceId);
        }
      },
    }
  );

  const audioResourceId = createResource<AudioSharedSceneResource>(
    ctx,
    Thread.Main,
    SceneResourceType,
    {
      audioSceneTripleBuffer,
    },
    {
      name,
      dispose() {
        for (const audioEmitter of _audioEmitters) {
          disposeResource(ctx, audioEmitter.resourceId);
        }
      },
    }
  );

  if (_backgroundTexture) {
    addResourceRef(ctx, _backgroundTexture.resourceId);
  }

  if (_reflectionProbe) {
    addResourceRef(ctx, _reflectionProbe.resourceId);
  }

  for (const audioEmitter of _audioEmitters) {
    addResourceRef(ctx, audioEmitter.resourceId);
  }

  const remoteScene: RemoteScene = {
    name,
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
      if (texture) {
        addResourceRef(ctx, texture.resourceId);
      }

      if (_backgroundTexture) {
        disposeResource(ctx, _backgroundTexture.resourceId);
      }

      _backgroundTexture = texture;
      rendererSceneBufferView.backgroundTexture[0] = texture ? texture.resourceId : 0;
    },
    get reflectionProbe(): RemoteReflectionProbe | undefined {
      return _reflectionProbe;
    },
    set reflectionProbe(reflectionProbe: RemoteReflectionProbe | undefined) {
      if (reflectionProbe) {
        addResourceRef(ctx, reflectionProbe.resourceId);
      }

      if (_reflectionProbe) {
        disposeResource(ctx, _reflectionProbe.resourceId);
      }

      _reflectionProbe = reflectionProbe;
      rendererSceneBufferView.reflectionProbe[0] = reflectionProbe ? reflectionProbe.resourceId : 0;
    },
    get audioEmitters(): RemoteGlobalAudioEmitter[] {
      return _audioEmitters;
    },
    set audioEmitters(emitters: RemoteGlobalAudioEmitter[]) {
      for (const audioEmitter of emitters) {
        addResourceRef(ctx, audioEmitter.resourceId);
      }

      for (const audioEmitter of _audioEmitters) {
        disposeResource(ctx, audioEmitter.resourceId);
      }

      _audioEmitters = emitters;
      audioSceneBufferView.audioEmitters.set(emitters.map((e) => e.resourceId));
    },
    get bloomStrength(): number {
      return rendererSceneBufferView.bloomStrength[0];
    },
    set bloomStrength(value: number) {
      rendererSceneBufferView.bloomStrength[0] = value;
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
