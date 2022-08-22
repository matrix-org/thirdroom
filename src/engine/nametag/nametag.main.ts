import { ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { AudioModule, MainAudioModule } from "../audio/audio.main";
import { NOOP } from "../config.common";
import { IMainThreadContext } from "../MainThread";
import { getModule } from "../module/module.common";
import { NametagTripleBuffer, SharedNametagResource } from "../nametag/nametag.common";
import { AudioNodeTripleBuffer } from "../node/node.common";
import { MainNode } from "../node/node.main";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource } from "../resource/resource.main";

export interface LocalNametag {
  resourceId: number;
  name: string;
  tripleBuffer: NametagTripleBuffer;
}

export async function onLoadMainNametag(
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  { name, tripleBuffer }: SharedNametagResource
): Promise<LocalNametag> {
  const audioModule = getModule(ctx, AudioModule);

  const nametag: LocalNametag = {
    resourceId,
    name,
    tripleBuffer,
  };

  audioModule.nametags.push(nametag);

  audioModule.eventEmitter.emit("nametags-changed", audioModule.nametags);

  return nametag;
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
      node.nametag = getLocalResource<LocalNametag>(ctx, nextRid)?.resource;
    }
  }
}
