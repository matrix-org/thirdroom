import { DirectionalLight, Light, PointLight, Scene, SpotLight } from "three";

import { getModule } from "../module/module.common";
import { updateTransformFromNode } from "../node/node.render";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { RenderNode } from "../resource/resource.render";
import { LightType } from "../resource/schema";

export function updateNodeLight(ctx: RenderThreadState, scene: Scene, node: RenderNode) {
  const { renderPipeline } = getModule(ctx, RendererModule);
  const currentLightResourceId = node.currentLightResourceId;
  const nextLightResourceId = node.light?.eid || 0;

  // TODO: Handle node.visible

  if (currentLightResourceId !== nextLightResourceId && node.lightObject) {
    scene.remove(node.lightObject);
    node.lightObject = undefined;
  }

  node.currentLightResourceId = nextLightResourceId;

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

      if (renderPipeline.directionalShadowMapSize) {
        directionalLight.shadow.mapSize.copy(renderPipeline.directionalShadowMapSize);
      }

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

      scene.add(pointLight);
    }

    pointLight.color.fromArray(localLight.color);
    pointLight.intensity = localLight.intensity;
    pointLight.castShadow = localLight.castShadow;
    pointLight.distance = localLight.range;

    if (renderPipeline.shadowMapSize) {
      pointLight.shadow.mapSize.copy(renderPipeline.shadowMapSize);
    }

    light = pointLight;
  } else if (lightType === LightType.Spot) {
    let spotLight = node.lightObject as SpotLight | undefined;

    if (!spotLight) {
      spotLight = new SpotLight();
      spotLight.target.position.set(0, 0, -1);
      spotLight.add(spotLight.target);

      scene.add(spotLight);
    }

    spotLight.color.fromArray(localLight.color);
    spotLight.intensity = localLight.intensity;
    spotLight.castShadow = localLight.castShadow;
    spotLight.distance = localLight.range;
    spotLight.angle = localLight.outerConeAngle;
    spotLight.penumbra = 1.0 - localLight.innerConeAngle / localLight.outerConeAngle;

    if (renderPipeline.shadowMapSize) {
      spotLight.shadow.mapSize.copy(renderPipeline.shadowMapSize);
    }

    light = spotLight;
  }

  if (light) {
    updateTransformFromNode(ctx, node, light);
  }

  node.lightObject = light;
}
