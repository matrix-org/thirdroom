import { MainThreadAudioEmitterResource } from "../audio/audio.main";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { SceneResource } from "../resource/schema";

export class MainScene extends defineLocalResourceClass<typeof SceneResource>(SceneResource) {
  declare audioEmitters: MainThreadAudioEmitterResource[];
}
