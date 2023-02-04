import { GameState } from "../GameTypes";
import { RemoteAudioSource } from "../resource/RemoteResources";
import { defineModule, getModule, Thread } from "../module/module.common";
import { AudioAction, AudioPlaybackRingBuffer, enqueueAudioPlaybackRingBuffer } from "./AudioPlaybackRingBuffer";
import { AudioAnalyserTripleBuffer, AudioMessageType, InitializeAudioStateMessage } from "./audio.common";

export interface PlayAudioOptions {
  gain?: number;
  playbackRate?: number;
}

interface GameAudioModule {
  audioPlaybackRingBuffer: AudioPlaybackRingBuffer;
  analyserTripleBuffer: AudioAnalyserTripleBuffer;
}

export const AudioModule = defineModule<GameState, GameAudioModule>({
  name: "audio",
  async create(ctx, { waitForMessage }) {
    const { audioPlaybackRingBuffer, analyserTripleBuffer } = await waitForMessage<InitializeAudioStateMessage>(
      Thread.Main,
      AudioMessageType.InitializeAudioState
    );

    return {
      analyserTripleBuffer,
      audioPlaybackRingBuffer,
    };
  },
  init() {},
});

function enqueueAudioPlaybackItem(
  ctx: GameState,
  action: AudioAction,
  audioSource: RemoteAudioSource,
  gain: number,
  playbackRate: number,
  time: number
) {
  const { audioPlaybackRingBuffer } = getModule(ctx, AudioModule);

  if (
    !enqueueAudioPlaybackRingBuffer(
      audioPlaybackRingBuffer,
      action,
      audioSource.eid,
      ctx.tick,
      gain,
      playbackRate,
      time
    )
  ) {
    console.warn("Audio ring buffer full");
  }
}

export function playAudio(ctx: GameState, audioSource: RemoteAudioSource, time?: number) {
  enqueueAudioPlaybackItem(ctx, AudioAction.Play, audioSource, 1, 1, time || 0);
}

export function playOneShotAudio(ctx: GameState, audioSource: RemoteAudioSource, gain = 1, playbackRate = 1) {
  enqueueAudioPlaybackItem(ctx, AudioAction.PlayOneShot, audioSource, gain, playbackRate, 0);
}

export function pauseAudio(ctx: GameState, audioSource: RemoteAudioSource) {
  enqueueAudioPlaybackItem(ctx, AudioAction.Pause, audioSource, 1, 1, 0);
}

export function seekAudio(ctx: GameState, audioSource: RemoteAudioSource, time: number) {
  enqueueAudioPlaybackItem(ctx, AudioAction.Seek, audioSource, 1, 1, time);
}

export function stopAudio(ctx: GameState, audioSource: RemoteAudioSource) {
  enqueueAudioPlaybackItem(ctx, AudioAction.Stop, audioSource, 1, 1, 0);
}
