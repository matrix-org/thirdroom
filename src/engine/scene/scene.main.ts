import { AudioModule, LocalGlobalAudioEmitter } from "../audio/audio.main";
import { IMainThreadContext } from "../MainThread";
import { getModule } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
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

  const mainScene: MainScene = {
    resourceId,
    audioSceneTripleBuffer,
    audioEmitters: [],
  };

  audioModule.scenes.push(mainScene);

  return mainScene;
}
