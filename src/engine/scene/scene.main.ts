import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { AudioModule, MainAudioModule } from "../audio/audio.main";
import { IMainThreadContext } from "../MainThread";
import { getModule } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { AudioSceneTripleBuffer, AudioSharedSceneResource } from "./scene.common";

export interface MainScene {
  resourceId: ResourceId;
  audioSceneTripleBuffer: AudioSceneTripleBuffer;
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
  };

  audioModule.scenes.push(mainScene);

  return mainScene;
}

export function updateMainSceneResources(
  ctx: IMainThreadContext,
  audioModule: MainAudioModule,
  activeScene: MainScene | undefined
) {
  if (!activeScene) {
    return; // TODO: Cleanup
  }

  const activeSceneView = getReadObjectBufferView(activeScene.audioSceneTripleBuffer);

  activeSceneView.audioEmitters;
}
