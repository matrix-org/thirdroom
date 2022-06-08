import { vec3, vec4 } from "gl-matrix";

import {
  commitToTripleBufferView,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import { RemoteTexture } from "../texture/texture.game";
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

export interface UnlitMaterialProps {
  doubleSided?: boolean; // default false
  alphaCutoff?: number; // default 0.5
  alphaMode?: MaterialAlphaMode; // default MaterialAlphaMode.OPAQUE
  baseColorFactor?: vec4; // default [1, 1, 1, 1]
  baseColorTexture?: RemoteTexture;
}

export interface StandardMaterialProps {
  doubleSided?: boolean; // default false
  alphaCutoff?: number; // default 0.5
  alphaMode?: MaterialAlphaMode; // default MaterialAlphaMode.OPAQUE
  baseColorFactor?: vec4; // default [1, 1, 1, 1]
  baseColorTexture?: RemoteTexture;
  metallicFactor?: number; // default 1
  roughnessFactor?: number; // default 1
  metallicRoughnessTexture?: RemoteTexture;
  normalTextureScale?: number; // default 1
  normalTexture?: RemoteTexture;
  occlusionTextureStrength?: number; // default 1
  occlusionTexture?: RemoteTexture;
  emissiveFactor?: vec3; // default [0, 0, 0]
  emissiveTexture?: RemoteTexture;
}

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
  get baseColorTexture(): RemoteTexture | undefined;
  set baseColorTexture(value: RemoteTexture | undefined);
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
  get baseColorTexture(): RemoteTexture | undefined;
  set baseColorTexture(texture: RemoteTexture | undefined);
  get metallicFactor(): number;
  set metallicFactor(value: number);
  get roughnessFactor(): number;
  set roughnessFactor(value: number);
  get metallicRoughnessTexture(): RemoteTexture | undefined;
  set metallicRoughnessTexture(texture: RemoteTexture | undefined);
  get normalTextureScale(): number;
  set normalTextureScale(value: number);
  get normalTexture(): RemoteTexture | undefined;
  set normalTexture(texture: RemoteTexture | undefined);
  get occlusionTextureStrength(): number;
  set occlusionTextureStrength(value: number);
  get occlusionTexture(): RemoteTexture | undefined;
  set occlusionTexture(texture: RemoteTexture | undefined);
  get emissiveFactor(): vec3;
  set emissiveFactor(value: vec3);
  get emissiveTexture(): RemoteTexture | undefined;
  set emissiveTexture(texture: RemoteTexture | undefined);
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

export function createRemoteUnlitMaterial(ctx: GameState, props: UnlitMaterialProps): RemoteUnlitMaterial {
  const materialModule = getModule(ctx, MaterialModule);

  const material = createObjectBufferView(unlitMaterialSchema, ArrayBuffer);

  const initialProps: UnlitMaterialResourceProps = {
    doubleSided: props.doubleSided || false,
    alphaCutoff: props.alphaCutoff === undefined ? 0.5 : props.alphaCutoff,
    alphaMode: props.alphaMode === undefined ? MaterialAlphaMode.OPAQUE : props.alphaMode,
    baseColorFactor: props.baseColorFactor || [1, 1, 1, 1],
    baseColorTexture: props.baseColorTexture ? props.baseColorTexture.resourceId : 0,
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

  const resourceId = createResource<SharedUnlitMaterialResource>(ctx, Thread.Render, UnlitMaterialResourceType, {
    type: MaterialType.Unlit,
    initialProps,
    sharedMaterial,
  });

  let _baseColorTexture: RemoteTexture | undefined;

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
    get baseColorTexture(): RemoteTexture | undefined {
      return _baseColorTexture;
    },
    set baseColorTexture(texture: RemoteTexture | undefined) {
      _baseColorTexture = texture;
      material.baseColorTexture[0] = texture ? texture.resourceId : 0;
      material.needsUpdate[0] = 1;
    },
  };

  materialModule.unlitMaterials.push(remoteMaterial);

  return remoteMaterial;
}

export function createRemoteStandardMaterial(ctx: GameState, props: StandardMaterialProps): RemoteStandardMaterial {
  const materialModule = getModule(ctx, MaterialModule);

  const material = createObjectBufferView(standardMaterialSchema, ArrayBuffer);

  const initialProps: StandardMaterialResourceProps = {
    doubleSided: props.doubleSided || false,
    alphaCutoff: props.alphaCutoff === undefined ? 0.5 : props.alphaCutoff,
    alphaMode: props.alphaMode === undefined ? MaterialAlphaMode.OPAQUE : props.alphaMode,
    baseColorFactor: props.baseColorFactor || [1, 1, 1, 1],
    baseColorTexture: props.baseColorTexture ? props.baseColorTexture.resourceId : 0,
    metallicFactor: props.metallicFactor === undefined ? 1 : props.metallicFactor,
    roughnessFactor: props.roughnessFactor === undefined ? 1 : props.roughnessFactor,
    metallicRoughnessTexture: props.metallicRoughnessTexture ? props.metallicRoughnessTexture.resourceId : 0,
    normalTextureScale: props.normalTextureScale === undefined ? 1 : props.normalTextureScale,
    normalTexture: props.normalTexture ? props.normalTexture.resourceId : 0,
    occlusionTextureStrength: props.occlusionTextureStrength === undefined ? 1 : props.occlusionTextureStrength,
    occlusionTexture: props.occlusionTexture ? props.occlusionTexture.resourceId : 0,
    emissiveFactor: props.emissiveFactor || [0, 0, 0],
    emissiveTexture: props.emissiveTexture ? props.emissiveTexture.resourceId : 0,
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

  const resourceId = createResource<SharedStandardMaterialResource>(ctx, Thread.Render, StandardMaterialResourceType, {
    type: MaterialType.Standard,
    initialProps,
    sharedMaterial,
  });

  let _baseColorTexture: RemoteTexture | undefined;
  let _metallicRoughnessTexture: RemoteTexture | undefined;
  let _normalTexture: RemoteTexture | undefined;
  let _occlusionTexture: RemoteTexture | undefined;
  let _emissiveTexture: RemoteTexture | undefined;

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
    get baseColorTexture(): RemoteTexture | undefined {
      return _baseColorTexture;
    },
    set baseColorTexture(texture: RemoteTexture | undefined) {
      _baseColorTexture = texture;
      material.baseColorTexture[0] = texture ? texture.resourceId : 0;
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
    get metallicRoughnessTexture(): RemoteTexture | undefined {
      return _metallicRoughnessTexture;
    },
    set metallicRoughnessTexture(texture: RemoteTexture | undefined) {
      _metallicRoughnessTexture = texture;
      material.metallicRoughnessTexture[0] = texture ? texture.resourceId : 0;
      material.needsUpdate[0] = 1;
    },
    get normalTextureScale(): number {
      return material.normalTextureScale[0];
    },
    set normalTextureScale(value: number) {
      material.normalTextureScale[0] = value;
      material.needsUpdate[0] = 1;
    },
    get normalTexture(): RemoteTexture | undefined {
      return _normalTexture;
    },
    set normalTexture(texture: RemoteTexture | undefined) {
      _normalTexture = texture;
      material.normalTexture[0] = texture ? texture.resourceId : 0;
      material.needsUpdate[0] = 1;
    },
    get occlusionTextureStrength(): number {
      return material.occlusionTextureStrength[0];
    },
    set occlusionTextureStrength(value: number) {
      material.occlusionTextureStrength[0] = value;
      material.needsUpdate[0] = 1;
    },
    get occlusionTexture(): RemoteTexture | undefined {
      return _occlusionTexture;
    },
    set occlusionTexture(texture: RemoteTexture | undefined) {
      _occlusionTexture = texture;
      material.occlusionTexture[0] = texture ? texture.resourceId : 0;
      material.needsUpdate[0] = 1;
    },
    get emissiveFactor(): vec3 {
      return material.emissiveFactor;
    },
    set emissiveFactor(value: vec3) {
      material.emissiveFactor.set(value);
      material.needsUpdate[0] = 1;
    },
    get emissiveTexture(): RemoteTexture | undefined {
      return _emissiveTexture;
    },
    set emissiveTexture(texture: RemoteTexture | undefined) {
      _emissiveTexture = texture;
      material.emissiveTexture[0] = texture ? texture.resourceId : 0;
      material.needsUpdate[0] = 1;
    },
  };

  materialModule.standardMaterials.push(remoteMaterial);

  return remoteMaterial;
}
