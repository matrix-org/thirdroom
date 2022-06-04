import { vec3, vec4 } from "gl-matrix";

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
  MaterialAlphaMode,
  SharedUnlitMaterial,
  SharedUnlitMaterialResource,
  UnlitMaterialResourceProps,
  UnlitMaterialResourceType,
  unlitMaterialSchema,
  MaterialType,
  StandardMaterialResourceProps,
  standardMaterialSchema,
  SharedStandardMaterialResource,
  StandardMaterialResourceType,
} from "./material.common";

export interface RemoteUnlitMaterial {
  resourceId: ResourceId;
  type: MaterialType.Unlit;
  sharedMaterial: SharedUnlitMaterial;
  get doubleSided(): boolean;
  set doubleSided(value: boolean);
  get alphaCutoff(): number;
  set alphaCutoff(value: number);
  get baseColorFactor(): vec4;
  set baseColorFactor(value: vec4);
  get baseColorTexture(): ResourceId;
  set baseColorTexture(value: ResourceId);
}

export interface RemoteStandardMaterial {
  resourceId: ResourceId;
  type: MaterialType.Unlit;
  sharedMaterial: SharedUnlitMaterial;
  get doubleSided(): boolean;
  set doubleSided(value: boolean);
  get alphaCutoff(): number;
  set alphaCutoff(value: number);
  get baseColorFactor(): vec4;
  set baseColorFactor(value: vec4);
  get baseColorTexture(): ResourceId;
  set baseColorTexture(value: ResourceId);
  get metallicFactor(): number;
  set metallicFactor(value: number);
  get roughnessFactor(): number;
  set roughnessFactor(value: number);
  get metallicRoughnessTexture(): ResourceId;
  set metallicRoughnessTexture(value: ResourceId);
  get normalTextureScale(): number;
  set normalTextureScale(value: number);
  get normalTexture(): ResourceId;
  set normalTexture(value: ResourceId);
  get occlusionTextureStrength(): number;
  set occlusionTextureStrength(value: number);
  get occlusionTexture(): ResourceId;
  set occlusionTexture(value: ResourceId);
  get emissiveFactor(): vec3;
  set emissiveFactor(value: vec3);
  get emissiveTexture(): ResourceId;
  set emissiveTexture(value: ResourceId);
}

export type RemoteMaterial = RemoteUnlitMaterial | RemoteStandardMaterial;

export interface MaterialModuleState {
  unlitMaterials: RemoteUnlitMaterial[];
  standardMaterials: RemoteStandardMaterial[];
}

export const MaterialModule = defineModule<GameState, MaterialModuleState>({
  name: "material",
  create() {
    return {
      unlitMaterials: [],
      standardMaterials: [],
    };
  },
  init() {},
});

export function MaterialUpdateSystem(ctx: GameState) {
  const { unlitMaterials, standardMaterials } = getModule(ctx, MaterialModule);

  for (let i = 0; i < unlitMaterials.length; i++) {
    const unlitMaterial = unlitMaterials[i];

    if (unlitMaterial.sharedMaterial.needsUpdate[0]) {
      commitToTripleBufferView(unlitMaterial.sharedMaterial);
      unlitMaterial.sharedMaterial.needsUpdate[0] = 0;
    }
  }

  for (let i = 0; i < standardMaterials.length; i++) {
    const standardMaterial = standardMaterials[i];

    if (standardMaterial.sharedMaterial.needsUpdate[0]) {
      commitToTripleBufferView(standardMaterial.sharedMaterial);
      standardMaterial.sharedMaterial.needsUpdate[0] = 0;
    }
  }
}

export function createUnlitMaterialResource(ctx: GameState, props: UnlitMaterialResourceProps): RemoteUnlitMaterial {
  const materialModule = getModule(ctx, MaterialModule);

  const material = createObjectBufferView(unlitMaterialSchema, ArrayBuffer);

  const initialProps: Required<UnlitMaterialResourceProps> = {
    doubleSided: props.doubleSided || false,
    alphaCutoff: props.alphaCutoff === undefined ? 0.5 : props.alphaCutoff,
    alphaMode: props.alphaMode === undefined ? MaterialAlphaMode.OPAQUE : props.alphaMode,
    baseColorFactor: props.baseColorFactor || [1, 1, 1, 1],
    baseColorTexture: props.baseColorTexture || 0,
  };

  material.doubleSided[0] = initialProps.doubleSided ? 1 : 0;
  material.alphaCutoff[0] = initialProps.alphaCutoff;
  material.alphaMode[0] = initialProps.alphaMode;
  material.baseColorFactor.set(initialProps.baseColorFactor);
  material.baseColorTexture[0] = initialProps.baseColorTexture;

  const sharedMaterial = createTripleBufferBackedObjectBufferView(
    unlitMaterialSchema,
    material,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedUnlitMaterialResource>(ctx, UnlitMaterialResourceType, {
    type: MaterialType.Unlit,
    initialProps,
    sharedMaterial,
  });

  const remoteMaterial: RemoteUnlitMaterial = {
    resourceId,
    sharedMaterial,
    type: MaterialType.Unlit,
    get doubleSided(): boolean {
      return !!material.doubleSided[0];
    },
    set doubleSided(value: boolean) {
      material.doubleSided[0] = value ? 1 : 0;
      material.needsUpdate[0] = 1;
    },
    get alphaCutoff(): number {
      return material.alphaCutoff[0];
    },
    set alphaCutoff(value: number) {
      material.alphaCutoff[0] = value;
      material.needsUpdate[0] = 1;
    },
    get baseColorFactor(): vec4 {
      return material.baseColorFactor;
    },
    set baseColorFactor(value: vec4) {
      material.baseColorFactor.set(value);
      material.needsUpdate[0] = 1;
    },
    get baseColorTexture(): ResourceId {
      return material.baseColorTexture[0];
    },
    set baseColorTexture(value: ResourceId) {
      material.baseColorTexture[0] = value;
      material.needsUpdate[0] = 1;
    },
  };

  materialModule.unlitMaterials.push(remoteMaterial);

  return remoteMaterial;
}

export function createStandardMaterialResource(
  ctx: GameState,
  props: StandardMaterialResourceProps
): RemoteStandardMaterial {
  const materialModule = getModule(ctx, MaterialModule);

  const material = createObjectBufferView(standardMaterialSchema, ArrayBuffer);

  const initialProps: Required<StandardMaterialResourceProps> = {
    doubleSided: props.doubleSided || false,
    alphaCutoff: props.alphaCutoff === undefined ? 0.5 : props.alphaCutoff,
    alphaMode: props.alphaMode === undefined ? MaterialAlphaMode.OPAQUE : props.alphaMode,
    baseColorFactor: props.baseColorFactor || [1, 1, 1, 1],
    baseColorTexture: props.baseColorTexture || 0,
    metallicFactor: props.metallicFactor === undefined ? 1 : props.metallicFactor,
    roughnessFactor: props.roughnessFactor === undefined ? 1 : props.roughnessFactor,
    metallicRoughnessTexture: props.metallicRoughnessTexture || 0,
    normalTextureScale: props.normalTextureScale === undefined ? 1 : props.normalTextureScale,
    normalTexture: props.normalTexture || 0,
    occlusionTextureStrength: props.occlusionTextureStrength === undefined ? 1 : props.occlusionTextureStrength,
    occlusionTexture: props.occlusionTexture || 0,
    emissiveFactor: props.emissiveFactor || [0, 0, 0],
    emissiveTexture: props.emissiveTexture || 0,
  };

  material.doubleSided[0] = initialProps.doubleSided ? 1 : 0;
  material.alphaCutoff[0] = initialProps.alphaCutoff;
  material.alphaMode[0] = initialProps.alphaMode;
  material.baseColorFactor.set(initialProps.baseColorFactor);
  material.baseColorTexture[0] = initialProps.baseColorTexture;
  material.metallicFactor[0] = initialProps.metallicFactor;
  material.roughnessFactor[0] = initialProps.roughnessFactor;
  material.metallicRoughnessTexture[0] = initialProps.metallicRoughnessTexture;
  material.normalTextureScale[0] = initialProps.normalTextureScale;
  material.normalTexture[0] = initialProps.normalTexture;
  material.occlusionTextureStrength[0] = initialProps.occlusionTextureStrength;
  material.occlusionTexture[0] = initialProps.occlusionTexture;
  material.emissiveFactor.set(initialProps.emissiveFactor);
  material.emissiveTexture[0] = initialProps.emissiveTexture;

  const sharedMaterial = createTripleBufferBackedObjectBufferView(
    standardMaterialSchema,
    material,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedStandardMaterialResource>(ctx, StandardMaterialResourceType, {
    type: MaterialType.Standard,
    initialProps,
    sharedMaterial,
  });

  const remoteMaterial: RemoteStandardMaterial = {
    resourceId,
    sharedMaterial,
    type: MaterialType.Unlit,
    get doubleSided(): boolean {
      return !!material.doubleSided[0];
    },
    set doubleSided(value: boolean) {
      material.doubleSided[0] = value ? 1 : 0;
      material.needsUpdate[0] = 1;
    },
    get alphaCutoff(): number {
      return material.alphaCutoff[0];
    },
    set alphaCutoff(value: number) {
      material.alphaCutoff[0] = value;
      material.needsUpdate[0] = 1;
    },
    get baseColorFactor(): vec4 {
      return material.baseColorFactor;
    },
    set baseColorFactor(value: vec4) {
      material.baseColorFactor.set(value);
      material.needsUpdate[0] = 1;
    },
    get baseColorTexture(): ResourceId {
      return material.baseColorTexture[0];
    },
    set baseColorTexture(value: ResourceId) {
      material.baseColorTexture[0] = value;
      material.needsUpdate[0] = 1;
    },
    get metallicFactor(): number {
      return material.metallicFactor[0];
    },
    set metallicFactor(value: number) {
      material.metallicFactor[0] = value;
      material.needsUpdate[0] = 1;
    },
    get roughnessFactor(): number {
      return material.roughnessFactor[0];
    },
    set roughnessFactor(value: number) {
      material.roughnessFactor[0] = value;
      material.needsUpdate[0] = 1;
    },
    get metallicRoughnessTexture(): ResourceId {
      return material.metallicRoughnessTexture[0];
    },
    set metallicRoughnessTexture(value: ResourceId) {
      material.metallicRoughnessTexture[0] = value;
      material.needsUpdate[0] = 1;
    },
    get normalTextureScale(): number {
      return material.normalTextureScale[0];
    },
    set normalTextureScale(value: number) {
      material.normalTextureScale[0] = value;
      material.needsUpdate[0] = 1;
    },
    get normalTexture(): ResourceId {
      return material.normalTexture[0];
    },
    set normalTexture(value: ResourceId) {
      material.normalTexture[0] = value;
      material.needsUpdate[0] = 1;
    },
    get occlusionTextureStrength(): number {
      return material.occlusionTextureStrength[0];
    },
    set occlusionTextureStrength(value: number) {
      material.occlusionTextureStrength[0] = value;
      material.needsUpdate[0] = 1;
    },
    get occlusionTexture(): ResourceId {
      return material.occlusionTexture[0];
    },
    set occlusionTexture(value: ResourceId) {
      material.occlusionTexture[0] = value;
      material.needsUpdate[0] = 1;
    },
    get emissiveFactor(): vec3 {
      return material.emissiveFactor;
    },
    set emissiveFactor(value: vec3) {
      material.emissiveFactor.set(value);
      material.needsUpdate[0] = 1;
    },
    get emissiveTexture(): ResourceId {
      return material.emissiveTexture[0];
    },
    set emissiveTexture(value: ResourceId) {
      material.emissiveTexture[0] = value;
      material.needsUpdate[0] = 1;
    },
  };

  materialModule.standardMaterials.push(remoteMaterial);

  return remoteMaterial;
}
