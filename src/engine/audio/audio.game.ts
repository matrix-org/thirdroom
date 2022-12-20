import { GameState } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import {
  AudioMessageType,
  audioStateSchema,
  InitializeAudioStateMessage,
  AudioStateTripleBuffer,
} from "./audio.common";
import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { RemoteScene, RemoteSceneComponent, updateAudioRemoteScenes } from "../scene/scene.game";
import { RemoteNodeComponent } from "../node/node.game";
import { getRemoteResources } from "../resource/resource.game";
import { AudioSourceResource, RemoteAudioSource } from "../resource/schema";

interface GameAudioModuleState {
  audioStateBufferView: ObjectBufferView<typeof audioStateSchema, ArrayBuffer>;
  audioStateTripleBuffer: AudioStateTripleBuffer;
  scenes: RemoteScene[];
}

export const GameAudioModule = defineModule<GameState, GameAudioModuleState>({
  name: "audio",
  async create({ gameToRenderTripleBufferFlags }, { sendMessage }) {
    const audioStateBufferView = createObjectBufferView(audioStateSchema, ArrayBuffer);
    const audioStateTripleBuffer = createObjectTripleBuffer(audioStateSchema, gameToRenderTripleBufferFlags);

    sendMessage<InitializeAudioStateMessage>(Thread.Main, AudioMessageType.InitializeAudioState, {
      audioStateTripleBuffer,
    });

    return {
      audioStateBufferView,
      audioStateTripleBuffer,
      scenes: [],
    };
  },
  init() {},
});

export interface PlayAudioOptions {
  gain?: number;
  startTime?: number;
  loop?: boolean;
  playbackRate?: number;
}

export function playAudio(audioSource: RemoteAudioSource, options?: PlayAudioOptions) {
  audioSource.play = true;
  audioSource.playing = true;
  audioSource.playbackRate = 1;

  if (options) {
    if (options.gain !== undefined) {
      audioSource.gain = options.gain;
    }

    if (options.startTime !== undefined) {
      audioSource.seek = options.startTime;
    }

    if (options.loop !== undefined) {
      audioSource.loop = options.loop;
    }

    if (options.playbackRate !== undefined) {
      audioSource.playbackRate = options.playbackRate;
    }
  }
}

/**
 * Systems
 */

export function GameAudioSystem(ctx: GameState) {
  const audioModule = getModule(ctx, GameAudioModule);

  const activeScene = RemoteSceneComponent.get(ctx.activeScene);
  const activeCamera = RemoteNodeComponent.get(ctx.activeCamera);

  audioModule.audioStateBufferView.activeAudioListenerResourceId[0] = activeCamera?.resourceId || 0;
  audioModule.audioStateBufferView.activeSceneResourceId[0] = activeScene?.audioResourceId || 0;

  commitToObjectTripleBuffer(audioModule.audioStateTripleBuffer, audioModule.audioStateBufferView);

  const audioSources = getRemoteResources(ctx, AudioSourceResource);

  for (let i = 0; i < audioSources.length; i++) {
    const audioSource = audioSources[i];

    if (audioSource.autoPlay && !audioSource.playing) {
      audioSource.play = true;
      audioSource.playing = true;
    }
  }

  updateAudioRemoteScenes(audioModule.scenes);
}

export function ResetAudioSourcesSystem(ctx: GameState) {
  const audioSources = getRemoteResources(ctx, AudioSourceResource);

  for (let i = 0; i < audioSources.length; i++) {
    const audioSource = audioSources[i];

    audioSource.play = false;
    audioSource.seek = -1;
  }
}
