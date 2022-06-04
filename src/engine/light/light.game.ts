import { vec3 } from "gl-matrix";

import {
  commitToTripleBufferView,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { defineModule, getModule } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import {
  DirectionalLightResourceProps,
  DirectionalLightResourceType,
  directionalLightSchema,
  LightType,
  PointLightResourceProps,
  PointLightResourceType,
  pointLightSchema,
  SharedDirectionalLight,
  SharedDirectionalLightResource,
  SharedPointLight,
  SharedPointLightResource,
  SharedSpotLight,
  SharedSpotLightResource,
  SpotLightResourceProps,
  SpotLightResourceType,
  spotLightSchema,
} from "./light.common";

export interface RemoteDirectionalLight {
  resourceId: ResourceId;
  type: LightType.Directional;
  sharedLight: SharedDirectionalLight;
  get color(): vec3;
  set color(value: vec3);
  get intensity(): number;
  set intensity(value: number);
  get castShadow(): boolean;
  set castShadow(value: boolean);
}

export interface RemotePointLight {
  resourceId: ResourceId;
  type: LightType.Point;
  sharedLight: SharedPointLight;
  get color(): vec3;
  set color(value: vec3);
  get intensity(): number;
  set intensity(value: number);
  get range(): number;
  set range(value: number);
  get castShadow(): boolean;
  set castShadow(value: boolean);
}

export interface RemoteSpotLight {
  resourceId: ResourceId;
  type: LightType.Spot;
  sharedLight: SharedSpotLight;
  get color(): vec3;
  set color(value: vec3);
  get intensity(): number;
  set intensity(value: number);
  get range(): number;
  set range(value: number);
  get innerConeAngle(): number;
  set innerConeAngle(value: number);
  get outerConeAngle(): number;
  set outerConeAngle(value: number);
  get castShadow(): boolean;
  set castShadow(value: boolean);
}

export type RemoteLight = RemoteDirectionalLight | RemotePointLight | RemoteSpotLight;

export interface LightModuleState {
  lightResources: Map<number, RemoteLight>;
}

export const LightModule = defineModule<GameState, LightModuleState>({
  name: "light",
  create() {
    return {
      lightResources: new Map(),
    };
  },
  init() {},
});

export function LightUpdateSystem(ctx: GameState) {
  const { lightResources } = getModule(ctx, LightModule);

  for (const [, remoteLight] of lightResources) {
    commitToTripleBufferView(remoteLight.sharedLight as any);
    remoteLight.sharedLight.needsUpdate[0] = 0;
  }
}

export function addDirectionalLightResource(
  ctx: GameState,
  eid: number,
  props?: DirectionalLightResourceProps
): RemoteDirectionalLight {
  const lightModule = getModule(ctx, LightModule);

  const light = createObjectBufferView(directionalLightSchema, ArrayBuffer);

  const initialProps: Required<DirectionalLightResourceProps> = Object.assign(
    {
      color: [1, 1, 1],
      intensity: 1,
      castShadow: false,
    },
    props
  );

  light.color.set(initialProps.color);
  light.intensity[0] = initialProps.intensity;
  light.castShadow[0] = initialProps.castShadow ? 1 : 0;

  const sharedLight = createTripleBufferBackedObjectBufferView(
    directionalLightSchema,
    light,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedDirectionalLightResource>(ctx, DirectionalLightResourceType, {
    eid,
    type: LightType.Directional,
    initialProps,
    sharedLight,
  });

  const remoteLight: RemoteDirectionalLight = {
    resourceId,
    sharedLight,
    type: LightType.Directional,
    get color(): vec3 {
      return light.color;
    },
    set color(value: vec3) {
      light.color.set(value);
    },
    get intensity(): number {
      return light.intensity[0];
    },
    set intensity(value: number) {
      light.intensity[0] = value;
    },
    get castShadow(): boolean {
      return !!light.castShadow[0];
    },
    set castShadow(value: boolean) {
      light.castShadow[0] = value ? 1 : 0;
    },
  };

  lightModule.lightResources.set(eid, remoteLight);

  return remoteLight;
}

export function addPointLightResource(ctx: GameState, eid: number, props?: PointLightResourceProps): RemotePointLight {
  const lightModule = getModule(ctx, LightModule);

  const light = createObjectBufferView(pointLightSchema, ArrayBuffer);

  const initialProps: Required<PointLightResourceProps> = Object.assign(
    {
      color: [1, 1, 1],
      intensity: 1,
      range: 0, // When 0 range is infinite
      castShadow: false,
    },
    props
  );

  light.color.set(initialProps.color);
  light.intensity[0] = initialProps.intensity;
  light.range[0] = initialProps.range;
  light.castShadow[0] = initialProps.castShadow ? 1 : 0;

  const sharedLight = createTripleBufferBackedObjectBufferView(
    pointLightSchema,
    light,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedPointLightResource>(ctx, PointLightResourceType, {
    eid,
    type: LightType.Point,
    initialProps,
    sharedLight,
  });

  const remoteLight: RemotePointLight = {
    resourceId,
    sharedLight,
    type: LightType.Point,
    get color(): vec3 {
      return light.color;
    },
    set color(value: vec3) {
      light.color.set(value);
    },
    get intensity(): number {
      return light.intensity[0];
    },
    set intensity(value: number) {
      light.intensity[0] = value;
    },
    get range(): number {
      return light.range[0];
    },
    set range(value: number) {
      light.range[0] = value;
    },
    get castShadow(): boolean {
      return !!light.castShadow[0];
    },
    set castShadow(value: boolean) {
      light.castShadow[0] = value ? 1 : 0;
    },
  };

  lightModule.lightResources.set(eid, remoteLight);

  return remoteLight;
}

export function addSpotLightResource(ctx: GameState, eid: number, props?: SpotLightResourceProps): RemoteSpotLight {
  const lightModule = getModule(ctx, LightModule);

  const light = createObjectBufferView(spotLightSchema, ArrayBuffer);

  // https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_lights_punctual/schema/light.spot.schema.json
  const initialProps: Required<SpotLightResourceProps> = Object.assign(
    {
      color: [1, 1, 1],
      intensity: 1,
      innerConeAngle: 0,
      outerConeAngle: 0.7853981633974483,
      range: 0, // When 0 range is infinite
      castShadow: false,
    },
    props
  );

  light.color.set(initialProps.color);
  light.intensity[0] = initialProps.intensity;
  light.range[0] = initialProps.range;
  light.innerConeAngle[0] = initialProps.innerConeAngle;
  light.outerConeAngle[0] = initialProps.outerConeAngle;
  light.castShadow[0] = initialProps.castShadow ? 1 : 0;

  const sharedLight = createTripleBufferBackedObjectBufferView(spotLightSchema, light, ctx.gameToMainTripleBufferFlags);

  const resourceId = createResource<SharedSpotLightResource>(ctx, SpotLightResourceType, {
    eid,
    type: LightType.Spot,
    initialProps,
    sharedLight,
  });

  const remoteLight: RemoteSpotLight = {
    resourceId,
    sharedLight,
    type: LightType.Spot,
    get color(): vec3 {
      return light.color;
    },
    set color(value: vec3) {
      light.color.set(value);
    },
    get intensity(): number {
      return light.intensity[0];
    },
    set intensity(value: number) {
      light.intensity[0] = value;
    },
    get range(): number {
      return light.range[0];
    },
    set range(value: number) {
      light.range[0] = value;
    },
    get innerConeAngle(): number {
      return light.innerConeAngle[0];
    },
    set innerConeAngle(value: number) {
      light.innerConeAngle[0] = value;
    },
    get outerConeAngle(): number {
      return light.outerConeAngle[0];
    },
    set outerConeAngle(value: number) {
      light.outerConeAngle[0] = value;
    },
    get castShadow(): boolean {
      return !!light.castShadow[0];
    },
    set castShadow(value: boolean) {
      light.castShadow[0] = value ? 1 : 0;
    },
  };

  lightModule.lightResources.set(eid, remoteLight);

  return remoteLight;
}
