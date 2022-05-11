import { AudioState, getAudioBuffer } from "../audio";
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
  audioState: AudioState
): ResourceLoader<AudioDefinition, AudioBuffer> {
  return {
    type: AUDIO_RESOURCE,
    async load(def) {
      const audioBuffer = await getAudioBuffer(audioState, def.url);
      return {
        name: def.name,
        resource: audioBuffer,
      };
    },
  };
}
