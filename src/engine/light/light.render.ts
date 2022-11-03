import { DirectionalLight, Light, PointLight, Scene, SpotLight } from "three";

import { ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { RendererNodeTripleBuffer } from "../node/node.common";
import { LocalNode, updateTransformFromNode } from "../node/node.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { getLocalResource, getResourceDisposed } from "../resource/resource.render";
import { LightType, LocalLight } from "../resource/schema";

export function updateNodeLight(
  ctx: RenderThreadState,
  scene: Scene,
  node: LocalNode,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>
) {
  const currentLightResourceId = node.light?.resourceId || 0;
  const nextLightResourceId = nodeReadView.light[0];

  // TODO: Handle node.visible

  if (getResourceDisposed(ctx, nextLightResourceId)) {
    if (node.lightObject) {
      scene.remove(node.lightObject);
      node.lightObject = undefined;
    }

    node.light = undefined;
  }

  if (currentLightResourceId !== nextLightResourceId) {
    if (node.lightObject) {
      scene.remove(node.lightObject);
      node.lightObject = undefined;
    }

    if (nextLightResourceId) {
      node.light = getLocalResource<LocalLight>(ctx, nextLightResourceId)?.resource;
    } else {
      node.light = undefined;
    }
  }

  if (!node.light) {
    return;
  }

  const lightType = node.light.type;

  let light: Light | undefined;

  const localLight = node.light;

  if (lightType === LightType.Directional) {
    let directionalLight = node.lightObject as DirectionalLight | undefined;

    if (!directionalLight) {
      directionalLight = new DirectionalLight();
      // Ensure light points down negative z axis
      directionalLight.target.position.set(0, 0, -1);
      directionalLight.add(directionalLight.target);

      // TODO: Move to CSM
      directionalLight.shadow.camera.top = 100;
      directionalLight.shadow.camera.bottom = -100;
      directionalLight.shadow.camera.left = -100;
      directionalLight.shadow.camera.right = 100;
      directionalLight.shadow.camera.near = 10;
      directionalLight.shadow.camera.far = 600;
      directionalLight.shadow.bias = 0.0001;
      directionalLight.shadow.normalBias = 0.2;
      directionalLight.shadow.mapSize.set(2048, 2048);

      scene.add(directionalLight);
    }

    directionalLight.color.fromArray(localLight.color);
    directionalLight.intensity = localLight.intensity;
    directionalLight.castShadow = localLight.castShadow;

    light = directionalLight;
  } else if (lightType === LightType.Point) {
    let pointLight = node.lightObject as PointLight | undefined;

    if (!pointLight) {
      pointLight = new PointLight();
      pointLight.decay = 2;

      scene.add(pointLight);
    }

    pointLight.color.fromArray(localLight.color);
    pointLight.intensity = localLight.intensity;
    pointLight.castShadow = localLight.castShadow;
    pointLight.distance = localLight.range;

    light = pointLight;
  } else if (lightType === LightType.Spot) {
    let spotLight = node.lightObject as SpotLight | undefined;

    if (!spotLight) {
      spotLight = new SpotLight();
      spotLight.target.position.set(0, 0, -1);
      spotLight.add(spotLight.target);
      spotLight.decay = 2;

      scene.add(spotLight);
    }

    spotLight.color.fromArray(localLight.color);
    spotLight.intensity = localLight.intensity;
    spotLight.castShadow = localLight.castShadow;
    spotLight.distance = localLight.range;
    spotLight.angle = localLight.outerConeAngle;
    spotLight.penumbra = 1.0 - localLight.innerConeAngle / localLight.outerConeAngle;

    light = spotLight;
  }

  if (light) {
    updateTransformFromNode(ctx, nodeReadView, light);
  }

  node.lightObject = light;
}
