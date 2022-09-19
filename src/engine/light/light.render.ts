import { DirectionalLight, Light, Material, PointLight, Scene, SpotLight } from "three";

import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { getModule } from "../module/module.common";
import { RendererNodeTripleBuffer } from "../node/node.common";
import { LocalNode, setWorldDirectionFromNode, updateTransformFromNode } from "../node/node.render";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource } from "../resource/resource.render";
import { CSMDirectionalLight } from "./CSMDirectionalLight";
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
  scene: Scene,
  node: LocalNode,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>
) {
  const rendererModule = getModule(ctx, RendererModule);
  const currentLightResourceId = node.light?.resourceId || 0;
  const nextLightResourceId = nodeReadView.light[0];

  // TODO: Handle node.visible

  if (currentLightResourceId !== nextLightResourceId) {
    if (node.lightObject) {
      if ("isCSMDirectionalLight" in node.lightObject) {
        rendererModule.mainLight = undefined;
      }

      scene.remove(node.lightObject);
      node.lightObject = undefined;
    }

    if (nextLightResourceId) {
      node.light = getLocalResource<LocalLightResource>(ctx, nextLightResourceId)?.resource;
    } else {
      node.light = undefined;
    }
  }

  if (!node.light) {
    return;
  }

  const lightType = node.light.type;

  let light: Light | CSMDirectionalLight | undefined;

  if (lightType === LightType.Directional) {
    let directionalLight = node.lightObject as CSMDirectionalLight | DirectionalLight | undefined;

    if (!directionalLight) {
      if (!rendererModule.mainLight) {
        const csmLight = new CSMDirectionalLight();
        directionalLight = csmLight;
        rendererModule.mainLight = csmLight;
      } else {
        console.warn(
          "Warning: Scene uses more than one directional light. CSM will only be enabled for the first light."
        );
        directionalLight = new DirectionalLight();
        directionalLight.target.position.set(0, 0, -1);
        directionalLight.add(directionalLight.target);
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.near = 10;
        directionalLight.shadow.camera.far = 600;
        directionalLight.shadow.bias = 0.0001;
        directionalLight.shadow.normalBias = 0.2;
        directionalLight.shadow.mapSize.setScalar(2048);
      }

      scene.add(directionalLight);
    }

    const sharedLight = getReadObjectBufferView(node.light.lightTripleBuffer);

    if ("isCSMDirectionalLight" in directionalLight) {
      directionalLight.setColor(sharedLight.color);
      directionalLight.setIntensity(sharedLight.intensity[0]);
      directionalLight.setCastShadow(!!sharedLight.castShadow[0]);
    } else {
      directionalLight.color.fromArray(sharedLight.color);
      directionalLight.intensity = sharedLight.intensity[0];
      directionalLight.castShadow = !!sharedLight.castShadow[0];
    }

    light = directionalLight;
  } else if (lightType === LightType.Point) {
    let pointLight = node.lightObject as PointLight | undefined;

    if (!pointLight) {
      pointLight = new PointLight();
      pointLight.decay = 2;

      scene.add(pointLight);
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

      scene.add(spotLight);
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
    if ("isCSMDirectionalLight" in light) {
      setWorldDirectionFromNode(nodeReadView, light.direction, light);
    } else {
      updateTransformFromNode(ctx, nodeReadView, light);
    }
  }

  node.lightObject = light;
}

export function updateMainLight(ctx: RenderThreadState, cameraNode: LocalNode | undefined, nodes: LocalNode[]) {
  const rendererModule = getModule(ctx, RendererModule);
  const mainLight = rendererModule.mainLight;
  const camera = cameraNode?.cameraObject;

  if (!mainLight || !camera || !("isPerspectiveCamera" in camera)) {
    return;
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.meshPrimitiveObjects) {
      for (let i = 0; i < node.meshPrimitiveObjects.length; i++) {
        const meshPrimitive = node.meshPrimitiveObjects[i];
        mainLight.updateMaterial(camera, meshPrimitive.material as Material);
      }
    }
  }

  mainLight.update(camera);
}
