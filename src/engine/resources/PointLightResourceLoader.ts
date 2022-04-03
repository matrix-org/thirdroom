import { PointLight } from "three";

import { RemoteResourceManager, loadRemoteResource, RemoteResourceLoader } from "./RemoteResourceManager";
import { ResourceDefinition, ResourceLoader, ResourceManager } from "./ResourceManager";

const POINT_LIGHT_RESOURCE = "point_light";

export interface IPointLightDefinition extends ResourceDefinition {
  type: "point_light";
}

export interface PointLightDefinition extends IPointLightDefinition {
  color?: Integer;
  intensity?: Float;
  distance: Number;
  decay: Float;
}

export function PointLightResourceLoader(manager: ResourceManager): ResourceLoader<PointLightDefinition, PointLight> {
  return {
    type: POINT_LIGHT_RESOURCE,
    async load(def) {
      const pointLight: PointLight = new PointLight(def.color, def.intensity, def.distance, def.decay);
      pointLight.castShadow = true;
      pointLight.name = def.name!;

      return {
        name: def.name,
        resource: pointLight,
      };
    },
  };
}

export function PointLightRemoteResourceLoader(manager: RemoteResourceManager): RemoteResourceLoader {
  return {
    type: POINT_LIGHT_RESOURCE,
  };
}

export function createRemotePointLight(manager: RemoteResourceManager, pointLightDef: PointLightDefinition): number {
  return loadRemoteResource(manager, pointLightDef);
}
