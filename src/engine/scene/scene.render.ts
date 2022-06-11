import { EquirectangularReflectionMapping, Scene, Texture } from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { getModule } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource, waitForLocalResource } from "../resource/resource.render";
import { RendererSceneTripleBuffer, RendererSharedSceneResource } from "./scene.common";

export interface LocalSceneResource {
  scene: Scene;
  backgroundTextureResourceId?: ResourceId;
  environmentTextureResourceId?: ResourceId;
  sharedScene: RendererSceneTripleBuffer;
}

export async function onLoadLocalSceneResource(
  ctx: RenderThreadState,
  id: ResourceId,
  { initialProps, rendererSceneTripleBuffer: sharedScene }: RendererSharedSceneResource
): Promise<Scene> {
  const sceneModule = getModule(ctx, RendererModule);

  const scene = new Scene();

  if (initialProps) {
    const promises: Promise<void>[] = [];

    if (initialProps.background) {
      promises.push(
        waitForLocalResource<Texture>(ctx, initialProps.background).then((texture) => {
          scene.background = texture;
        })
      );
    }

    if (initialProps.environment) {
      promises.push(
        waitForLocalResource<Texture>(ctx, initialProps.environment).then((texture) => {
          // TODO: Move to texture loader?
          if (texture) {
            texture.mapping = EquirectangularReflectionMapping;
          }

          scene.environment = texture;
        })
      );
    }

    await Promise.all(promises);
  }

  sceneModule.scenes.push({
    scene,
    backgroundTextureResourceId: initialProps?.background || 0,
    environmentTextureResourceId: initialProps?.environment || 0,
    sharedScene,
  });

  return scene;
}

export function updateLocalSceneResources(ctx: RenderThreadState, scenes: LocalSceneResource[]) {
  for (let i = 0; i < scenes.length; i++) {
    const sceneResource = scenes[i];
    const { scene, sharedScene, backgroundTextureResourceId, environmentTextureResourceId } = sceneResource;
    const props = getReadObjectBufferView(sharedScene);

    if (props.background[0] !== backgroundTextureResourceId) {
      const resourceId = props.background[0];
      const textureResource = getLocalResource<Texture>(ctx, resourceId);

      if (textureResource && textureResource.resource) {
        scene.background = textureResource.resource;
        sceneResource.environmentTextureResourceId = resourceId;
      } else {
        waitForLocalResource<Texture>(ctx, props.background[0]).then((texture) => {
          const currentProps = getReadObjectBufferView(sharedScene);

          if (currentProps.background[0] === resourceId) {
            scene.background = texture;
            sceneResource.environmentTextureResourceId = resourceId;
          }
        });
      }
    }

    if (props.environment[0] !== environmentTextureResourceId) {
      const resourceId = props.environment[0];
      const textureResource = getLocalResource<Texture>(ctx, resourceId);

      if (textureResource && textureResource.resource) {
        scene.environment = textureResource.resource;
        sceneResource.environmentTextureResourceId = resourceId;
      } else {
        waitForLocalResource<Texture>(ctx, props.environment[0]).then((texture) => {
          const currentProps = getReadObjectBufferView(sharedScene);

          if (currentProps.environment[0] === resourceId) {
            scene.environment = texture;
            sceneResource.environmentTextureResourceId = resourceId;
          }
        });
      }
    }
  }
}
