import { ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { AudioModule, MainAudioModule } from "../audio/audio.main";
import { NOOP } from "../config.common";
import { IMainThreadContext } from "../MainThread";
import { getModule } from "../module/module.common";
import { AudioNodeTripleBuffer } from "../node/node.common";
import { MainNode } from "../node/node.main";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { getLocalResource } from "../resource/resource.main";
import { NametagResource } from "../resource/schema";

export class MainThreadNametagResource extends defineLocalResourceClass<typeof NametagResource, IMainThreadContext>(
  NametagResource
) {
  async load(ctx: IMainThreadContext) {
    const audioModule = getModule(ctx, AudioModule);
    audioModule.eventEmitter.emit("nametags-changed", audioModule.nametags);
  }
}

export function updateNametag(
  ctx: IMainThreadContext,
  audioModule: MainAudioModule,
  node: MainNode,
  nodeView: ReadObjectTripleBufferView<AudioNodeTripleBuffer>
) {
  const currentRid = node.nametag?.resourceId || 0;
  const nextRid = nodeView.nametag[0];

  if (currentRid !== nextRid) {
    node.nametag = undefined;

    if (nextRid !== NOOP) {
      node.nametag = getLocalResource<MainThreadNametagResource>(ctx, nextRid)?.resource;
    }
  }
}
