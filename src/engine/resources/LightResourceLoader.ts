import { DirectionalLight, Light, PointLight, Color, SpotLight } from "three";

import { ResourceDefinition, ResourceLoader, ResourceManager } from "./ResourceManager";

export const LIGHT_RESOURCE = "light";

export enum LightType {
  Directional = "directional",
  Point = "point",
  Spot = "spot",
}

export interface ILightDefinition extends ResourceDefinition {
  type: "light";
  lightType: LightType;
  color?: number[];
  intensity?: number;
  range?: number;
}

export interface DirectionalLightDefinition extends ILightDefinition {
  lightType: LightType.Directional;
}

export interface PointLightDefinition extends ILightDefinition {
  lightType: LightType.Point;
}

export interface SpotLightDefinition extends ILightDefinition {
  lightType: LightType.Spot;
  innerConeAngle?: number;
  outerConeAngle?: number;
}

export type LightDefinition = DirectionalLightDefinition | PointLightDefinition | SpotLightDefinition;

export function LightResourceLoader(manager: ResourceManager): ResourceLoader<LightDefinition, Light> {
  return {
    type: LIGHT_RESOURCE,
    async load(def) {
      let light: Light;

      const color = def.color ? new Color().fromArray(def.color) : 0xffffff;
      const intensity = def.intensity === undefined ? 1 : def.intensity;
      const range = def.range || 0;
      const decay = 2;

      switch (def.lightType) {
        case LightType.Directional: {
          light = new DirectionalLight(color, intensity);
          break;
        }
        case LightType.Point:
          light = new PointLight(color, intensity, range, decay);
          break;
        case LightType.Spot: {
          const innerConeAngle = def.innerConeAngle === undefined ? 0 : def.innerConeAngle;
          const outerConeAngle = def.outerConeAngle === undefined ? Math.PI / 4 : def.outerConeAngle;
          light = new SpotLight(color, intensity, range, outerConeAngle, 1.0 - innerConeAngle / outerConeAngle, decay);
          break;
        }
        default:
          throw new Error(`Unknown light type ${(def as unknown as any).lightType}`);
      }

      light.position.set(0, 0, 0);

      if (def.lightType === LightType.Directional || def.lightType === LightType.Spot) {
        const targetLight = light as DirectionalLight | SpotLight;
        // Ensure light points down negative z axis
        targetLight.target.position.set(0, 0, -1);
        targetLight.add(targetLight.target);
      }

      if (def.name) {
        light.name = def.name;
      }

      return {
        name: def.name,
        resource: light,
      };
    },
  };
}
