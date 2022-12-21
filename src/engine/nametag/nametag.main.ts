import { AudioModule } from "../audio/audio.main";
import { IMainThreadContext } from "../MainThread";
import { getModule } from "../module/module.common";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { getLocalResources } from "../resource/resource.main";
import { NametagResource } from "../resource/schema";

export class MainThreadNametagResource extends defineLocalResourceClass<typeof NametagResource, IMainThreadContext>(
  NametagResource
) {
  async load(ctx: IMainThreadContext) {
    const audioModule = getModule(ctx, AudioModule);
    const nametags = getLocalResources(ctx, MainThreadNametagResource);
    audioModule.eventEmitter.emit("nametags-changed", [...nametags, this]);
  }
}
