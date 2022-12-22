import { IMainThreadContext } from "../MainThread";
import { getModule } from "../module/module.common";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { AudioEmitterResource, AudioEmitterOutput, AudioEmitterType } from "../resource/schema";
import { MainThreadAudioSourceResource } from "./audio-source.main";
import { AudioModule } from "./audio.main";

export class MainThreadAudioEmitterResource extends defineLocalResourceClass<
  typeof AudioEmitterResource,
  IMainThreadContext
>(AudioEmitterResource) {
  declare sources: MainThreadAudioSourceResource[];
  activeSources: MainThreadAudioSourceResource[] = [];
  inputGain: GainNode | undefined;
  outputGain: GainNode | undefined;
  destination: AudioNode | undefined;

  async load(ctx: IMainThreadContext) {
    const audioModule = getModule(ctx, AudioModule);
    const audioContext = audioModule.context;

    this.inputGain = audioContext.createGain();
    // input gain connected by node update

    this.outputGain = audioContext.createGain();
    const destination =
      this.output === AudioEmitterOutput.Voice
        ? audioModule.voiceGain
        : this.output === AudioEmitterOutput.Music
        ? audioModule.musicGain
        : audioModule.environmentGain;
    this.outputGain.connect(destination);
    this.destination = destination;

    if (this.type === AudioEmitterType.Global) {
      this.inputGain.connect(this.outputGain);
    }
  }

  dispose() {
    if (this.inputGain) {
      this.inputGain.disconnect();
    }

    if (this.outputGain) {
      this.outputGain.disconnect();
    }
  }
}
