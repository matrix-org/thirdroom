import { GameState } from "../GameTypes";
import { getRemoteResources, RemoteAudioSource } from "../resource/resource.game";

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
