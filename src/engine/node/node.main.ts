import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { AudioModule, LocalPositionalAudioEmitter } from "../audio/audio.main";
import { IMainThreadContext } from "../MainThread";
import { getModule } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { waitForLocalResource } from "../resource/resource.main";
import { AudioNodeTripleBuffer, AudioSharedNodeResource } from "./node.common";

export interface MainNode {
  resourceId: number;
  audioNodeTripleBuffer: AudioNodeTripleBuffer;
  audioEmitter?: LocalPositionalAudioEmitter;
  emitterPannerNode?: PannerNode;
}

export async function onLoadMainNode(
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  { audioNodeTripleBuffer }: AudioSharedNodeResource
): Promise<MainNode> {
  const audioModule = getModule(ctx, AudioModule);
  const nodeView = getReadObjectBufferView(audioNodeTripleBuffer);

  let audioEmitter: LocalPositionalAudioEmitter | undefined;

  if (nodeView.audioEmitter[0]) {
    audioEmitter = await waitForLocalResource<LocalPositionalAudioEmitter>(ctx, nodeView.audioEmitter[0]);
  }

  const mainNode: MainNode = {
    resourceId,
    audioNodeTripleBuffer,
    audioEmitter,
  };

  audioModule.nodes.push(mainNode);

  return mainNode;
}
