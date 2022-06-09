import { DirectionalLight, PointLight, SpotLight } from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import {
  LightType,
  SharedDirectionalLight,
  SharedDirectionalLightResource,
  SharedPointLight,
  SharedPointLightResource,
  SharedSpotLight,
  SharedSpotLightResource,
} from "./light.common";

export interface LocalDirectionalLightResource {
  type: LightType.Directional;
  light: DirectionalLight;
  sharedLight: SharedDirectionalLight;
}

export interface LocalPointLightResource {
  type: LightType.Point;
  light: PointLight;
  sharedLight: SharedPointLight;
}

export interface LocalSpotLightResource {
  type: LightType.Spot;
  light: SpotLight;
  sharedLight: SharedSpotLight;
}

export type LocalLightResource = LocalDirectionalLightResource | LocalPointLightResource | LocalSpotLightResource;

export async function onLoadLocalDirectionalLightResource(
  ctx: RenderThreadState,
  id: ResourceId,
  { type, initialProps, sharedLight }: SharedDirectionalLightResource
): Promise<DirectionalLight> {
  const rendererModule = getModule(ctx, RendererModule);

  const light = new DirectionalLight();
  light.intensity = initialProps.intensity;
  light.color.fromArray(initialProps.color);
  light.castShadow = initialProps.castShadow;

  // Ensure light points down negative z axis
  light.target.position.set(0, 0, -1);
  light.add(light.target);

  const directionalLightResource: LocalDirectionalLightResource = {
    type,
    light,
    sharedLight,
  };

  rendererModule.directionalLights.push(directionalLightResource);

  return light;
}

export async function onLoadLocalPointLightResource(
  ctx: RenderThreadState,
  id: ResourceId,
  { type, initialProps, sharedLight }: SharedPointLightResource
): Promise<PointLight> {
  const rendererModule = getModule(ctx, RendererModule);

  const light = new PointLight();
  light.intensity = initialProps.intensity;
  light.color.fromArray(initialProps.color);
  light.castShadow = initialProps.castShadow;
  light.distance = initialProps.range;
  light.decay = 2;

  const pointLightResource: LocalPointLightResource = {
    type,
    light,
    sharedLight,
  };

  rendererModule.pointLights.push(pointLightResource);

  return light;
}

export async function onLoadLocalSpotLightResource(
  ctx: RenderThreadState,
  id: ResourceId,
  { type, initialProps, sharedLight }: SharedSpotLightResource
): Promise<PointLight> {
  const rendererModule = getModule(ctx, RendererModule);

  const light = new SpotLight();
  light.intensity = initialProps.intensity;
  light.color.fromArray(initialProps.color);
  light.castShadow = initialProps.castShadow;
  light.distance = initialProps.range;
  light.angle = initialProps.outerConeAngle;
  light.penumbra = 1.0 - initialProps.innerConeAngle / initialProps.outerConeAngle;
  light.decay = 2;

  const spotLightResource: LocalSpotLightResource = {
    type,
    light,
    sharedLight,
  };

  rendererModule.spotLights.push(spotLightResource);

  return light;
}

export function updateLocalDirectionalLightResources(directionalLightResources: LocalDirectionalLightResource[]) {
  for (let i = 0; i < directionalLightResources.length; i++) {
    const { light, sharedLight } = directionalLightResources[i];
    const props = getReadObjectBufferView(sharedLight);

    // Update the directional light properties from the triple buffer
    if (props.needsUpdate[0]) {
      light.color.fromArray(sharedLight.color);
      light.intensity = sharedLight.intensity[0];
      light.castShadow = !!sharedLight.castShadow[0];
    }
  }
}

export function updateLocalPointLightResources(pointLightResources: LocalPointLightResource[]) {
  for (let i = 0; i < pointLightResources.length; i++) {
    const { light, sharedLight } = pointLightResources[i];
    const props = getReadObjectBufferView(sharedLight);

    if (props.needsUpdate[0]) {
      light.color.fromArray(sharedLight.color);
      light.intensity = sharedLight.intensity[0];
      light.castShadow = !!sharedLight.castShadow[0];
      light.distance = sharedLight.range[0];
    }
  }
}

export function updateLocalSpotLightResources(spotLightResources: LocalSpotLightResource[]) {
  for (let i = 0; i < spotLightResources.length; i++) {
    const { light, sharedLight } = spotLightResources[i];
    const props = getReadObjectBufferView(sharedLight);

    if (props.needsUpdate[0]) {
      light.color.fromArray(sharedLight.color);
      light.intensity = sharedLight.intensity[0];
      light.castShadow = !!sharedLight.castShadow[0];
      light.distance = sharedLight.range[0];
      light.angle = sharedLight.outerConeAngle[0];
      light.penumbra = 1.0 - sharedLight.innerConeAngle[0] / sharedLight.outerConeAngle[0];
    }
  }
}
