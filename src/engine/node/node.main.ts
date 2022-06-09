import { LocalPositionalAudioEmitter } from "../audio/audio.main";
import { AudioSharedNode } from "./node.common";

export interface MainNode {
  audioSharedNode: AudioSharedNode;
  audioEmitterPannerNode?: PannerNode;
  audioEmitter?: LocalPositionalAudioEmitter;
}
