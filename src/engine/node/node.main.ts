import { AudioModule, LocalPositionalAudioEmitter } from "../audio/audio.main";
import { IMainThreadContext } from "../MainThread";
import { getModule } from "../module/module.common";
import { LocalNametag } from "../nametag/nametag.main";
import { ResourceId } from "../resource/resource.common";
import { AudioEmitterOutput } from "../resource/schema";
import { AudioNodeTripleBuffer, AudioSharedNodeResource } from "./node.common";

export interface MainNode {
  resourceId: number;
  audioNodeTripleBuffer: AudioNodeTripleBuffer;
  audioEmitter?: LocalPositionalAudioEmitter;
  emitterPannerNode?: PannerNode;
  emitterOutput?: AudioEmitterOutput;
  nametag?: LocalNametag;
}

export async function onLoadMainNode(
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  { audioNodeTripleBuffer }: AudioSharedNodeResource
): Promise<MainNode> {
  const audioModule = getModule(ctx, AudioModule);

  const mainNode: MainNode = {
    resourceId,
    audioNodeTripleBuffer,
  };

  audioModule.nodes.push(mainNode);

  return mainNode;
}
