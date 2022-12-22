import { IMainThreadContext } from "../MainThread";
import { getModule } from "../module/module.common";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { ResourceId } from "../resource/resource.common";
import { AudioSourceResource } from "../resource/schema";
import { MainThreadAudioDataResource } from "./audio-data.main";
import { AudioModule } from "./audio.main";

export class MainThreadAudioSourceResource extends defineLocalResourceClass<
  typeof AudioSourceResource,
  IMainThreadContext
>(AudioSourceResource) {
  declare audio: MainThreadAudioDataResource | undefined;
  activeAudioDataResourceId: ResourceId = 0;
  sourceNode: MediaElementAudioSourceNode | AudioBufferSourceNode | MediaStreamAudioSourceNode | undefined;
  gainNode: GainNode | undefined;

  async load(ctx: IMainThreadContext) {
    const audioModule = getModule(ctx, AudioModule);
    const audioContext = audioModule.context;
    this.gainNode = audioContext.createGain();
  }

  dispose() {
    if (this.gainNode) {
      this.gainNode.disconnect();
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
  }
}
