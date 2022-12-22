import { MainThreadAudioEmitterResource } from "../audio/audio-emitter.main";
import { MainThreadNametagResource } from "../nametag/nametag.main";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { AudioEmitterOutput, NodeResource } from "../resource/schema";

export class MainNode extends defineLocalResourceClass(NodeResource) {
  declare audioEmitter: MainThreadAudioEmitterResource | undefined;
  currentAudioEmitterResourceId = 0;
  emitterInputNode?: GainNode;
  emitterPannerNode?: PannerNode;
  emitterOutput?: AudioEmitterOutput;
  declare nametag: MainThreadNametagResource | undefined;

  dispose() {
    if (this.emitterPannerNode) {
      if (this.emitterInputNode) {
        this.emitterInputNode.disconnect(this.emitterPannerNode);
      }

      this.emitterPannerNode.disconnect();
    }
  }
}
