import { Color, Scene, Texture, EquirectangularReflectionMapping } from "three";

import { RemoteResourceManager, loadRemoteResource, RemoteResourceLoader } from "./RemoteResourceManager";
import { ResourceDefinition, ResourceLoader, ResourceManager, loadResource } from "./ResourceManager";

export const SCENE_RESOURCE = "scene";

export interface SceneDefinition extends ResourceDefinition {
  type: typeof SCENE_RESOURCE;
  backgroundColor?: number[];
  backgroundTextureResourceId?: number;
  environmentTextureResourceId?: number;
}

export function SceneResourceLoader(manager: ResourceManager): ResourceLoader<SceneDefinition, Scene> {
  return {
    type: SCENE_RESOURCE,
    async load(def) {
      const pending: Promise<void>[] = [];

      const scene = new Scene();

      if (def.backgroundTextureResourceId !== undefined) {
        pending.push(
          loadResource<Texture>(manager, def.backgroundTextureResourceId).then((texture) => {
            scene.background = texture || null;
          })
        );
      } else if (def.backgroundColor !== undefined) {
        scene.background = new Color().fromArray(def.backgroundColor);
      }

      if (def.environmentTextureResourceId !== undefined) {
        pending.push(
          loadResource<Texture>(manager, def.environmentTextureResourceId).then((texture) => {
            if (texture) {
              texture.mapping = EquirectangularReflectionMapping;
            }

            scene.environment = texture || null;
          })
        );
      }

      await Promise.all(pending);

      if (def.name) {
        scene.name = def.name;
      }

      return {
        name: def.name,
        resource: scene,
      };
    },
  };
}

export function SceneRemoteResourceLoader(manager: RemoteResourceManager): RemoteResourceLoader {
  return {
    type: SCENE_RESOURCE,
  };
}

export function createRemoteScene(manager: RemoteResourceManager, sceneDef: SceneDefinition): number {
  return loadRemoteResource(manager, sceneDef);
}
