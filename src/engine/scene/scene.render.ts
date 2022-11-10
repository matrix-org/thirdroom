import { Scene } from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { getModule } from "../module/module.common";
import { LocalReflectionProbeResource, updateSceneReflectionProbe } from "../reflection-probe/reflection-probe.render";
import { RendererModule } from "../renderer/renderer.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource, getResourceDisposed, waitForLocalResource } from "../resource/resource.render";
import { RendererTextureResource } from "../texture/texture.render";
import { promiseObject } from "../utils/promiseObject";
import { RendererSceneTripleBuffer, RendererSharedSceneResource } from "./scene.common";

export interface LocalSceneResource {
  resourceId: ResourceId;
  scene: Scene;
  backgroundTexture?: RendererTextureResource;
  reflectionProbe?: LocalReflectionProbeResource;
  reflectionProbeNeedsUpdate: boolean;
  rendererSceneTripleBuffer: RendererSceneTripleBuffer;
}

export async function onLoadLocalSceneResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { rendererSceneTripleBuffer }: RendererSharedSceneResource
): Promise<LocalSceneResource> {
  const rendererModule = getModule(ctx, RendererModule);

  const sceneView = getReadObjectBufferView(rendererSceneTripleBuffer);

  await promiseObject({
    backgroundTexture: sceneView.backgroundTexture[0]
      ? waitForLocalResource<RendererTextureResource>(ctx, sceneView.backgroundTexture[0])
      : undefined,
  });

  const scene = new Scene();

  const localSceneResource = {
    resourceId,
    scene,
    rendererSceneTripleBuffer,
    reflectionProbeNeedsUpdate: false,
  };

  rendererModule.scenes.push(localSceneResource);

  return localSceneResource;
}

export function updateLocalSceneResources(ctx: RenderThreadState, scenes: LocalSceneResource[]) {
  for (let i = scenes.length - 1; i >= 0; i--) {
    const sceneResource = scenes[i];

    if (getResourceDisposed(ctx, sceneResource.resourceId)) {
      scenes.splice(i, 1);
    }
  }

  for (let i = 0; i < scenes.length; i++) {
    const sceneResource = scenes[i];
    const { scene, rendererSceneTripleBuffer, backgroundTexture } = sceneResource;

    const sceneView = getReadObjectBufferView(rendererSceneTripleBuffer);

    const currentBackgroundTextureResourceId = backgroundTexture?.resourceId || 0;

    if (sceneView.backgroundTexture[0] !== currentBackgroundTextureResourceId) {
      if (sceneView.backgroundTexture[0]) {
        const nextBackgroundTexture = getLocalResource<RendererTextureResource>(
          ctx,
          sceneView.backgroundTexture[0]
        )?.resource;

        if (nextBackgroundTexture) {
          scene.background = nextBackgroundTexture.texture;
        }

        sceneResource.backgroundTexture = nextBackgroundTexture;
      } else {
        sceneResource.backgroundTexture = undefined;
        scene.background = null;
      }
    }

    updateSceneReflectionProbe(ctx, sceneResource, sceneView);
  }
}
