import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { AudioModule, LocalGlobalAudioEmitter } from "../audio/audio.main";
import { IMainThreadContext } from "../MainThread";
import { getModule } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { waitForLocalResource } from "../resource/resource.main";
import { AudioSceneTripleBuffer, AudioSharedSceneResource } from "./scene.common";

export interface MainScene {
  resourceId: ResourceId;
  audioSceneTripleBuffer: AudioSceneTripleBuffer;
  audioEmitters: LocalGlobalAudioEmitter[];
}

export async function onLoadMainSceneResource(
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  { audioSceneTripleBuffer }: AudioSharedSceneResource
): Promise<MainScene> {
  const audioModule = getModule(ctx, AudioModule);

  const sceneView = getReadObjectBufferView(audioSceneTripleBuffer);

  const mainScene: MainScene = {
    resourceId,
    audioSceneTripleBuffer,
    audioEmitters: await Promise.all(
      Array.from(sceneView.audioEmitters).map((resourceId) =>
        waitForLocalResource<LocalGlobalAudioEmitter>(ctx, resourceId)
      )
    ),
  };

  audioModule.scenes.push(mainScene);

  return mainScene;
}
