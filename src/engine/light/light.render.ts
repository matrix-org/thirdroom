import { DirectionalLight, PointLight, SpotLight } from "three";
import { CSM } from "three/examples/jsm/csm/CSM";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { defineModule, getModule } from "../module/module.common";
import {
  getActiveLocalCameraResource,
  getActiveLocalSceneResource,
  RenderThreadState,
} from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { registerResourceLoader } from "../resource/resource.render";
import {
  DirectionalLightResourceType,
  LightType,
  PointLightResourceType,
  SharedDirectionalLight,
  SharedDirectionalLightResource,
  SharedPointLight,
  SharedPointLightResource,
  SharedSpotLight,
  SharedSpotLightResource,
  SpotLightResourceType,
} from "./light.common";

interface LocalDirectionalLightResource {
  type: LightType.Directional;
  light: DirectionalLight;
  sharedLight: SharedDirectionalLight;
}

interface LocalPointLightResource {
  type: LightType.Point;
  light: PointLight;
  sharedLight: SharedPointLight;
}

interface LocalSpotLightResource {
  type: LightType.Spot;
  light: SpotLight;
  sharedLight: SharedSpotLight;
}

export type LocalLightResource = LocalDirectionalLightResource | LocalPointLightResource | LocalSpotLightResource;

type LightModuleState = {
  sun?: DirectionalLight;
  csm?: CSM;
  directionalLightResources: LocalDirectionalLightResource[];
  pointLightResources: LocalPointLightResource[];
  spotLightResources: LocalSpotLightResource[];
};

// TODO: Add light helpers
export const LightModule = defineModule<RenderThreadState, LightModuleState>({
  name: "light",
  create() {
    return {
      directionalLightResources: [],
      pointLightResources: [],
      spotLightResources: [],
    };
  },
  init(ctx) {
    // TODO: Reset CSM when sun light is disposed
    // Resource loaders could return a dispose function that's called when game thread
    // has disposed of this resource. Could track disposal by shared array buffer bit so
    // we can remove from the scene immediately
    const disposables = [
      registerResourceLoader(ctx, DirectionalLightResourceType, onLoadDirectionalLight),
      registerResourceLoader(ctx, PointLightResourceType, onLoadPointLight),
      registerResourceLoader(ctx, SpotLightResourceType, onLoadSpotLight),
    ];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

async function onLoadDirectionalLight(
  ctx: RenderThreadState,
  id: ResourceId,
  { type, initialProps, sharedLight }: SharedDirectionalLightResource
): Promise<DirectionalLight> {
  const lightModule = getModule(ctx, LightModule);
  const sceneResource = getActiveLocalSceneResource(ctx);
  const cameraResource = getActiveLocalCameraResource(ctx);

  const light = new DirectionalLight();
  light.intensity = initialProps.intensity;
  light.color.fromArray(initialProps.color);
  light.castShadow = initialProps.castShadow;

  // Ensure light points down negative z axis
  light.target.position.set(0, 0, -1);
  light.add(light.target);

  // If this is the first shadow casting directional light, use it as the sun light
  if (light.castShadow && !lightModule.csm && !lightModule.sun && cameraResource && sceneResource) {
    lightModule.csm = new CSM({
      parent: sceneResource.scene,
      camera: cameraResource.camera,
    });

    // The CSM object is going to use this light as a proxy
    light.visible = false;
    lightModule.sun = light;

    updateCSMFromDirectionalLight(lightModule.csm, light);
  }

  const directionalLightResource: LocalDirectionalLightResource = {
    type,
    light,
    sharedLight,
  };

  lightModule.directionalLightResources.push(directionalLightResource);

  return light;
}

function updateCSMFromDirectionalLight(csm: CSM, directionalLight: DirectionalLight) {
  const cascadeLights = csm.lights;

  for (let i = 0; i < cascadeLights.length; i++) {
    const cascadeLight = cascadeLights[i];
    cascadeLight.intensity = directionalLight.intensity;
    cascadeLight.color.copy(directionalLight.color);
  }

  directionalLight.getWorldDirection(csm.lightDirection);
}

async function onLoadPointLight(
  ctx: RenderThreadState,
  id: ResourceId,
  { type, initialProps, sharedLight }: SharedPointLightResource
): Promise<PointLight> {
  const lightModule = getModule(ctx, LightModule);

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

  lightModule.pointLightResources.push(pointLightResource);

  return light;
}

async function onLoadSpotLight(
  ctx: RenderThreadState,
  id: ResourceId,
  { type, initialProps, sharedLight }: SharedSpotLightResource
): Promise<PointLight> {
  const lightModule = getModule(ctx, LightModule);

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

  lightModule.spotLightResources.push(spotLightResource);

  return light;
}

export function LightUpdateSystem(ctx: RenderThreadState) {
  const lightModule = getModule(ctx, LightModule);
  updateDirectionalLights(ctx, lightModule);
  updatePointLights(ctx, lightModule);
  updateSpotLights(ctx, lightModule);
}

function updateDirectionalLights(ctx: RenderThreadState, lightModule: LightModuleState) {
  const sceneResource = getActiveLocalSceneResource(ctx);
  const cameraResource = getActiveLocalCameraResource(ctx);

  if (!sceneResource || !cameraResource) {
    return;
  }

  for (let i = 0; i < lightModule.directionalLightResources.length; i++) {
    const { light, sharedLight } = lightModule.directionalLightResources[i];
    const props = getReadObjectBufferView(sharedLight);

    // Update the directional light properties from the triple buffer
    if (props.needsUpdate[0]) {
      light.color.fromArray(sharedLight.color);
      light.intensity = sharedLight.intensity[0];
      light.castShadow = !!sharedLight.castShadow[0];
    }

    // Enable CSM for this light if it casts a shadow and there's no current sun light
    if (light.castShadow && !lightModule.sun) {
      if (!lightModule.csm) {
        lightModule.csm = new CSM({
          parent: sceneResource.scene,
          camera: cameraResource.camera,
        });
      }

      light.visible = false;
      lightModule.sun = light;
    }

    // Update CSM state if the directional light is the current sun light
    if (lightModule.csm && lightModule.sun && lightModule.sun === light) {
      lightModule.csm.parent = sceneResource.scene;
      lightModule.csm.camera = cameraResource.camera;

      updateCSMFromDirectionalLight(lightModule.csm, light);

      lightModule.csm.update();
    }
  }
}

function updatePointLights(ctx: RenderThreadState, lightModule: LightModuleState) {
  for (let i = 0; i < lightModule.pointLightResources.length; i++) {
    const { light, sharedLight } = lightModule.pointLightResources[i];
    const props = getReadObjectBufferView(sharedLight);

    if (props.needsUpdate[0]) {
      light.color.fromArray(sharedLight.color);
      light.intensity = sharedLight.intensity[0];
      light.castShadow = !!sharedLight.castShadow[0];
      light.distance = sharedLight.range[0];
    }
  }
}

function updateSpotLights(ctx: RenderThreadState, lightModule: LightModuleState) {
  for (let i = 0; i < lightModule.spotLightResources.length; i++) {
    const { light, sharedLight } = lightModule.spotLightResources[i];
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
