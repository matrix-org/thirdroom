import { DirectionalLight, Light, PointLight, SpotLight } from "three";

import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { RendererNodeTripleBuffer } from "../node/node.common";
import { LocalNode, updateTransformFromNode } from "../node/node.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource } from "../resource/resource.render";
import {
  DirectionalLightTripleBuffer,
  LightType,
  PointLightTripleBuffer,
  SharedDirectionalLightResource,
  SharedPointLightResource,
  SharedSpotLightResource,
  SpotLightTripleBuffer,
} from "./light.common";

export interface LocalDirectionalLightResource {
  resourceId: ResourceId;
  type: LightType.Directional;
  lightTripleBuffer: DirectionalLightTripleBuffer;
}

export interface LocalPointLightResource {
  resourceId: ResourceId;
  type: LightType.Point;
  lightTripleBuffer: PointLightTripleBuffer;
}

export interface LocalSpotLightResource {
  resourceId: ResourceId;
  type: LightType.Spot;
  lightTripleBuffer: SpotLightTripleBuffer;
}

export type LocalLightResource = LocalDirectionalLightResource | LocalPointLightResource | LocalSpotLightResource;

export async function onLoadLocalDirectionalLightResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { type, lightTripleBuffer }: SharedDirectionalLightResource
): Promise<LocalDirectionalLightResource> {
  return {
    resourceId,
    type,
    lightTripleBuffer,
  };
}

export async function onLoadLocalPointLightResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { type, lightTripleBuffer }: SharedPointLightResource
): Promise<LocalPointLightResource> {
  return {
    resourceId,
    type,
    lightTripleBuffer,
  };
}

export async function onLoadLocalSpotLightResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { type, lightTripleBuffer }: SharedSpotLightResource
): Promise<LocalSpotLightResource> {
  return {
    resourceId,
    type,
    lightTripleBuffer,
  };
}

export function updateNodeLight(
  ctx: RenderThreadState,
  node: LocalNode,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>
) {
  const currentLightResourceId = node.light?.resourceId || 0;
  const nextLightResourceId = nodeReadView.light[0];

  if (currentLightResourceId !== nextLightResourceId && node.lightObject) {
    node.scene.remove(node.lightObject);
    node.lightObject = undefined;
  }

  node.light = getLocalResource<LocalLightResource>(ctx, nextLightResourceId)?.resource;

  if (!node.light) {
    return;
  }

  const lightType = node.light.type;

  let light: Light | undefined;

  if (lightType === LightType.Directional) {
    let directionalLight = node.lightObject as DirectionalLight | undefined;

    if (!directionalLight) {
      directionalLight = new DirectionalLight();
      // Ensure light points down negative z axis
      directionalLight.target.position.set(0, 0, -1);
      directionalLight.add(directionalLight.target);

      node.scene.add(directionalLight);
    }

    const sharedLight = getReadObjectBufferView(node.light.lightTripleBuffer);

    directionalLight.color.fromArray(sharedLight.color);
    directionalLight.intensity = sharedLight.intensity[0];
    directionalLight.castShadow = !!sharedLight.castShadow[0];

    light = directionalLight;
  } else if (lightType === LightType.Point) {
    let pointLight = node.lightObject as PointLight | undefined;

    if (!pointLight) {
      pointLight = new PointLight();
      pointLight.decay = 2;

      node.scene.add(pointLight);
    }

    const sharedLight = getReadObjectBufferView(node.light.lightTripleBuffer);

    pointLight.color.fromArray(sharedLight.color);
    pointLight.intensity = sharedLight.intensity[0];
    pointLight.castShadow = !!sharedLight.castShadow[0];
    pointLight.distance = sharedLight.range[0];

    light = pointLight;
  } else if (lightType === LightType.Spot) {
    let spotLight = node.lightObject as SpotLight | undefined;

    if (!spotLight) {
      spotLight = new SpotLight();
      spotLight.decay = 2;

      node.scene.add(spotLight);
    }

    const sharedLight = getReadObjectBufferView(node.light.lightTripleBuffer);

    spotLight.color.fromArray(sharedLight.color);
    spotLight.intensity = sharedLight.intensity[0];
    spotLight.castShadow = !!sharedLight.castShadow[0];
    spotLight.distance = sharedLight.range[0];
    spotLight.angle = sharedLight.outerConeAngle[0];
    spotLight.penumbra = 1.0 - sharedLight.innerConeAngle[0] / sharedLight.outerConeAngle[0];

    light = spotLight;
  }

  if (light) {
    updateTransformFromNode(ctx, nodeReadView, light);
  }

  node.lightObject = light;
}
