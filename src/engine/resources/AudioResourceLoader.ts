import { IAudioScope, getAudioBuffer } from "../audio/audio.main";
import {
  // loadResource,
  ResourceDefinition,
  ResourceLoader,
  ResourceManager,
} from "./ResourceManager";

export const AUDIO_RESOURCE = "audio";

export interface AudioDefinition extends ResourceDefinition {
  type: typeof AUDIO_RESOURCE;
  audioResourceId: number;
  name: string;
  url: string;
}

export function AudioResourceLoader(
  manager: ResourceManager,
  audio: IAudioScope
): ResourceLoader<AudioDefinition, AudioBuffer> {
  return {
    type: AUDIO_RESOURCE,
    async load(def) {
      const audioBuffer = await getAudioBuffer(audio, def.url);
      return {
        name: def.name,
        resource: audioBuffer,
      };
    },
  };
}
