import { Scene } from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { getModule } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource, waitForLocalResource } from "../resource/resource.render";
import { LocalTextureResource } from "../texture/texture.render";
import { promiseObject } from "../utils/promiseObject";
import { RendererSceneTripleBuffer, RendererSharedSceneResource } from "./scene.common";

export interface LocalSceneResource {
  scene: Scene;
  backgroundTexture?: LocalTextureResource;
  environmentTexture?: LocalTextureResource;
  rendererSceneTripleBuffer: RendererSceneTripleBuffer;
}

export async function onLoadLocalSceneResource(
  ctx: RenderThreadState,
  id: ResourceId,
  { rendererSceneTripleBuffer }: RendererSharedSceneResource
): Promise<Scene> {
  const sceneModule = getModule(ctx, RendererModule);

  const sceneView = getReadObjectBufferView(rendererSceneTripleBuffer);

  const { backgroundTexture, environmentTexture } = await promiseObject({
    backgroundTexture: sceneView.backgroundTexture[0]
      ? waitForLocalResource<LocalTextureResource>(ctx, sceneView.backgroundTexture[0])
      : undefined,
    environmentTexture: sceneView.environmentTexture[0]
      ? waitForLocalResource<LocalTextureResource>(ctx, sceneView.environmentTexture[0])
      : undefined,
  });

  const scene = new Scene();

  sceneModule.scenes.push({
    scene,
    backgroundTexture,
    environmentTexture,
    rendererSceneTripleBuffer,
  });

  return scene;
}

export function updateLocalSceneResources(ctx: RenderThreadState, scenes: LocalSceneResource[]) {
  for (let i = 0; i < scenes.length; i++) {
    const sceneResource = scenes[i];
    const { scene, rendererSceneTripleBuffer, backgroundTexture, environmentTexture } = sceneResource;

    const sceneView = getReadObjectBufferView(rendererSceneTripleBuffer);

    const currentBackgroundTextureResourceId = backgroundTexture?.resourceId || 0;
    const currentEnvironmentTextureResourceId = environmentTexture?.resourceId || 0;

    if (sceneView.backgroundTexture[0] !== currentBackgroundTextureResourceId) {
      if (sceneView.backgroundTexture[0]) {
        const backgroundTexture = getLocalResource<LocalTextureResource>(ctx, sceneView.backgroundTexture[0])?.resource;

        if (backgroundTexture) {
          scene.background = backgroundTexture.texture;
        }

        sceneResource.backgroundTexture = backgroundTexture;
      } else {
        sceneResource.backgroundTexture = undefined;
        scene.background = null;
      }
    }

    if (sceneView.environmentTexture[0] !== currentEnvironmentTextureResourceId) {
      if (sceneView.environmentTexture[0]) {
        const environmentTexture = getLocalResource<LocalTextureResource>(
          ctx,
          sceneView.environmentTexture[0]
        )?.resource;

        if (environmentTexture) {
          scene.environment = environmentTexture.texture;
        }

        sceneResource.environmentTexture = environmentTexture;
      } else {
        sceneResource.environmentTexture = undefined;
        scene.environment = null;
      }
    }
  }
}
