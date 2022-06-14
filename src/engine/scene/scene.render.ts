import { Scene } from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { getModule } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { waitForLocalResource } from "../resource/resource.render";
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
  // TODO: Fix this up
  // for (let i = 0; i < scenes.length; i++) {
  //   const sceneResource = scenes[i];
  //   const { scene, rendererSceneTripleBuffer, backgroundTexture, environmentTexture } = sceneResource;
  //   const sceneView = getReadObjectBufferView(rendererSceneTripleBuffer);
  //   if (sceneView.backgroundTexture[0] !== backgroundTexture?.resourceId) {
  //     const resourceId = props.background[0];
  //     const textureResource = getLocalResource<Texture>(ctx, resourceId);
  //     if (textureResource && textureResource.resource) {
  //       scene.background = textureResource.resource;
  //       sceneResource.environmentTextureResourceId = resourceId;
  //     } else {
  //       waitForLocalResource<Texture>(ctx, props.background[0]).then((texture) => {
  //         const currentProps = getReadObjectBufferView(sharedScene);
  //         if (currentProps.background[0] === resourceId) {
  //           scene.background = texture;
  //           sceneResource.environmentTextureResourceId = resourceId;
  //         }
  //       });
  //     }
  //   }
  //   if (props.environment[0] !== environmentTextureResourceId) {
  //     const resourceId = props.environment[0];
  //     const textureResource = getLocalResource<Texture>(ctx, resourceId);
  //     if (textureResource && textureResource.resource) {
  //       scene.environment = textureResource.resource;
  //       sceneResource.environmentTextureResourceId = resourceId;
  //     } else {
  //       waitForLocalResource<Texture>(ctx, props.environment[0]).then((texture) => {
  //         const currentProps = getReadObjectBufferView(sharedScene);
  //         if (currentProps.environment[0] === resourceId) {
  //           scene.environment = texture;
  //           sceneResource.environmentTextureResourceId = resourceId;
  //         }
  //       });
  //     }
  //   }
  // }
}
