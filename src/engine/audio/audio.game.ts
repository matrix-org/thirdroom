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
import { getRemoteResources, RemoteAudioSource } from "../resource/resource.game";

interface GameAudioModuleState {
  audioStateBufferView: ObjectBufferView<typeof audioStateSchema, ArrayBuffer>;
  audioStateTripleBuffer: AudioStateTripleBuffer;
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

  audioModule.audioStateBufferView.activeAudioListenerResourceId[0] = ctx.activeCamera?.resourceId || 0;
  audioModule.audioStateBufferView.activeSceneResourceId[0] = ctx.activeScene?.resourceId || 0;

  commitToObjectTripleBuffer(audioModule.audioStateTripleBuffer, audioModule.audioStateBufferView);

  const audioSources = getRemoteResources(ctx, RemoteAudioSource);

  for (let i = 0; i < audioSources.length; i++) {
    const audioSource = audioSources[i];

    if (audioSource.autoPlay && !audioSource.playing) {
      audioSource.play = true;
      audioSource.playing = true;
    }
  }
}

export function ResetAudioSourcesSystem(ctx: GameState) {
  const audioSources = getRemoteResources(ctx, RemoteAudioSource);

  for (let i = 0; i < audioSources.length; i++) {
    const audioSource = audioSources[i];

    audioSource.play = false;
    audioSource.seek = -1;
  }
}
