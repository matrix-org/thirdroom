import { vec3, vec4 } from "gl-matrix";

import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.game";
import { ResourceId } from "../resource/resource.common";
import { addResourceRef, createResource, disposeResource } from "../resource/resource.game";
import { RemoteTexture } from "../texture/texture.game";
import {
  MaterialAlphaMode,
  UnlitMaterialTripleBuffer,
  SharedUnlitMaterialResource,
  UnlitMaterialResourceType,
  unlitMaterialSchema,
  MaterialType,
  standardMaterialSchema,
  SharedStandardMaterialResource,
  StandardMaterialResourceType,
} from "./material.common";

export interface UnlitMaterialProps {
  name?: string;
  doubleSided?: boolean; // default false
  alphaCutoff?: number; // default 0.5
  alphaMode?: MaterialAlphaMode; // default MaterialAlphaMode.OPAQUE
  baseColorFactor?: ArrayLike<number>; // default [1, 1, 1, 1]
  baseColorTexture?: RemoteTexture;
}

export interface StandardMaterialProps {
  name?: string;
  doubleSided?: boolean; // default false
  alphaCutoff?: number; // default 0.5
  alphaMode?: MaterialAlphaMode; // default MaterialAlphaMode.OPAQUE
  baseColorFactor?: ArrayLike<number>; // default [1, 1, 1, 1]
  baseColorTexture?: RemoteTexture;
  metallicFactor?: number; // default 1
  roughnessFactor?: number; // default 1
  metallicRoughnessTexture?: RemoteTexture;
  normalTextureScale?: number; // default 1
  normalTexture?: RemoteTexture;
  occlusionTextureStrength?: number; // default 1
  occlusionTexture?: RemoteTexture;
  emissiveFactor?: ArrayLike<number>; // default [0, 0, 0]
  emissiveTexture?: RemoteTexture;
}

export type UnlitMaterialBufferView = ObjectBufferView<typeof unlitMaterialSchema, ArrayBuffer>;
export type StandardMaterialBufferView = ObjectBufferView<typeof standardMaterialSchema, ArrayBuffer>;

export interface RemoteUnlitMaterial {
  name: string;
  resourceId: ResourceId;
  type: MaterialType.Unlit;
  materialBufferView: UnlitMaterialBufferView;
  materialTripleBuffer: UnlitMaterialTripleBuffer;
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
  name: string;
  resourceId: ResourceId;
  type: MaterialType.Standard;
  materialBufferView: StandardMaterialBufferView;
  materialTripleBuffer: UnlitMaterialTripleBuffer;
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

const DEFAULT_UNLIT_MATERIAL_NAME = "Unlit Matrial";
const DEFAULT_STANDARD_MATERIAL_NAME = "Standard Material";

export type RemoteMaterial = RemoteUnlitMaterial | RemoteStandardMaterial;

export function updateRemoteMaterials(ctx: GameState) {
  const { unlitMaterials, standardMaterials } = getModule(ctx, RendererModule);

  for (let i = 0; i < unlitMaterials.length; i++) {
    const unlitMaterial = unlitMaterials[i];
    commitToObjectTripleBuffer(unlitMaterial.materialTripleBuffer, unlitMaterial.materialBufferView);
  }

  for (let i = 0; i < standardMaterials.length; i++) {
    const standardMaterial = standardMaterials[i];
    commitToObjectTripleBuffer(standardMaterial.materialTripleBuffer, standardMaterial.materialBufferView);
  }
}

export function createRemoteUnlitMaterial(ctx: GameState, props: UnlitMaterialProps): RemoteUnlitMaterial {
  const rendererModule = getModule(ctx, RendererModule);

  const materialBufferView = createObjectBufferView(unlitMaterialSchema, ArrayBuffer);

  materialBufferView.doubleSided[0] = props.doubleSided ? 1 : 0;
  materialBufferView.alphaCutoff[0] = props.alphaCutoff === undefined ? 0.5 : props.alphaCutoff;
  materialBufferView.alphaMode[0] = props.alphaMode === undefined ? MaterialAlphaMode.OPAQUE : props.alphaMode;
  materialBufferView.baseColorFactor.set(props.baseColorFactor || [1, 1, 1, 1]);
  materialBufferView.baseColorTexture[0] = props.baseColorTexture ? props.baseColorTexture.resourceId : 0;

  const materialTripleBuffer = createObjectTripleBuffer(unlitMaterialSchema, ctx.gameToRenderTripleBufferFlags);

  let _baseColorTexture: RemoteTexture | undefined = props.baseColorTexture;

  if (_baseColorTexture) {
    addResourceRef(ctx, _baseColorTexture.resourceId);
  }

  const name = props.name || DEFAULT_UNLIT_MATERIAL_NAME;

  const resourceId = createResource<SharedUnlitMaterialResource>(
    ctx,
    Thread.Render,
    UnlitMaterialResourceType,
    {
      type: MaterialType.Unlit,
      materialTripleBuffer,
    },
    {
      name,
      dispose() {
        if (_baseColorTexture) {
          disposeResource(ctx, _baseColorTexture.resourceId);
        }

        const index = rendererModule.unlitMaterials.findIndex((material) => material.resourceId === resourceId);

        if (index !== -1) {
          rendererModule.unlitMaterials.splice(index, 1);
        }
      },
    }
  );

  const remoteMaterial: RemoteUnlitMaterial = {
    name,
    resourceId,
    materialBufferView,
    materialTripleBuffer,
    type: MaterialType.Unlit,
    get doubleSided(): boolean {
      return !!materialBufferView.doubleSided[0];
    },
    set doubleSided(value: boolean) {
      materialBufferView.doubleSided[0] = value ? 1 : 0;
    },
    get alphaCutoff(): number {
      return materialBufferView.alphaCutoff[0];
    },
    set alphaCutoff(value: number) {
      materialBufferView.alphaCutoff[0] = value;
    },
    get baseColorFactor(): vec4 {
      return materialBufferView.baseColorFactor;
    },
    set baseColorFactor(value: vec4) {
      materialBufferView.baseColorFactor.set(value);
    },
    get baseColorTexture(): RemoteTexture | undefined {
      return _baseColorTexture;
    },
    set baseColorTexture(texture: RemoteTexture | undefined) {
      if (texture) {
        addResourceRef(ctx, texture.resourceId);
      }

      if (_baseColorTexture) {
        disposeResource(ctx, _baseColorTexture.resourceId);
      }

      _baseColorTexture = texture;
      materialBufferView.baseColorTexture[0] = texture ? texture.resourceId : 0;
    },
  };

  rendererModule.unlitMaterials.push(remoteMaterial);

  return remoteMaterial;
}

export function createRemoteStandardMaterial(ctx: GameState, props: StandardMaterialProps): RemoteStandardMaterial {
  const rendererModule = getModule(ctx, RendererModule);

  const materialBufferView = createObjectBufferView(standardMaterialSchema, ArrayBuffer);

  materialBufferView.doubleSided[0] = props.doubleSided ? 1 : 0;
  materialBufferView.alphaCutoff[0] = props.alphaCutoff === undefined ? 0.5 : props.alphaCutoff;
  materialBufferView.alphaMode[0] = props.alphaMode === undefined ? MaterialAlphaMode.OPAQUE : props.alphaMode;
  materialBufferView.baseColorFactor.set(props.baseColorFactor || [1, 1, 1, 1]);
  materialBufferView.baseColorTexture[0] = props.baseColorTexture ? props.baseColorTexture.resourceId : 0;
  materialBufferView.metallicFactor[0] = props.metallicFactor === undefined ? 1 : props.metallicFactor;
  materialBufferView.roughnessFactor[0] = props.roughnessFactor === undefined ? 1 : props.roughnessFactor;
  materialBufferView.metallicRoughnessTexture[0] = props.metallicRoughnessTexture
    ? props.metallicRoughnessTexture.resourceId
    : 0;
  materialBufferView.normalTextureScale[0] = props.normalTextureScale === undefined ? 1 : props.normalTextureScale;
  materialBufferView.normalTexture[0] = props.normalTexture ? props.normalTexture.resourceId : 0;
  materialBufferView.occlusionTextureStrength[0] =
    props.occlusionTextureStrength === undefined ? 1 : props.occlusionTextureStrength;
  materialBufferView.occlusionTexture[0] = props.occlusionTexture ? props.occlusionTexture.resourceId : 0;
  materialBufferView.emissiveFactor.set(props.emissiveFactor || [0, 0, 0]);
  materialBufferView.emissiveTexture[0] = props.emissiveTexture ? props.emissiveTexture.resourceId : 0;

  const materialTripleBuffer = createObjectTripleBuffer(standardMaterialSchema, ctx.gameToRenderTripleBufferFlags);

  let _baseColorTexture: RemoteTexture | undefined = props.baseColorTexture;
  let _metallicRoughnessTexture: RemoteTexture | undefined = props.metallicRoughnessTexture;
  let _normalTexture: RemoteTexture | undefined = props.normalTexture;
  let _occlusionTexture: RemoteTexture | undefined = props.occlusionTexture;
  let _emissiveTexture: RemoteTexture | undefined = props.emissiveTexture;

  if (_baseColorTexture) {
    addResourceRef(ctx, _baseColorTexture.resourceId);
  }

  if (_metallicRoughnessTexture) {
    addResourceRef(ctx, _metallicRoughnessTexture.resourceId);
  }

  if (_normalTexture) {
    addResourceRef(ctx, _normalTexture.resourceId);
  }

  if (_occlusionTexture) {
    addResourceRef(ctx, _occlusionTexture.resourceId);
  }

  if (_emissiveTexture) {
    addResourceRef(ctx, _emissiveTexture.resourceId);
  }

  const name = props.name || DEFAULT_STANDARD_MATERIAL_NAME;

  const resourceId = createResource<SharedStandardMaterialResource>(
    ctx,
    Thread.Render,
    StandardMaterialResourceType,
    {
      type: MaterialType.Standard,
      materialTripleBuffer,
    },
    {
      name,
      dispose() {
        if (_baseColorTexture) {
          disposeResource(ctx, _baseColorTexture.resourceId);
        }

        if (_normalTexture) {
          disposeResource(ctx, _normalTexture.resourceId);
        }

        if (_metallicRoughnessTexture) {
          disposeResource(ctx, _metallicRoughnessTexture.resourceId);
        }

        if (_occlusionTexture) {
          disposeResource(ctx, _occlusionTexture.resourceId);
        }

        if (_emissiveTexture) {
          disposeResource(ctx, _emissiveTexture.resourceId);
        }

        const index = rendererModule.standardMaterials.findIndex((material) => material.resourceId === resourceId);

        if (index !== -1) {
          rendererModule.standardMaterials.splice(index, 1);
        }
      },
    }
  );

  const remoteMaterial: RemoteStandardMaterial = {
    name,
    resourceId,
    materialBufferView,
    materialTripleBuffer,
    type: MaterialType.Standard,
    get doubleSided(): boolean {
      return !!materialBufferView.doubleSided[0];
    },
    set doubleSided(value: boolean) {
      materialBufferView.doubleSided[0] = value ? 1 : 0;
    },
    get alphaCutoff(): number {
      return materialBufferView.alphaCutoff[0];
    },
    set alphaCutoff(value: number) {
      materialBufferView.alphaCutoff[0] = value;
    },
    get baseColorFactor(): vec4 {
      return materialBufferView.baseColorFactor;
    },
    set baseColorFactor(value: vec4) {
      materialBufferView.baseColorFactor.set(value);
    },
    get baseColorTexture(): RemoteTexture | undefined {
      return _baseColorTexture;
    },
    set baseColorTexture(texture: RemoteTexture | undefined) {
      if (texture) {
        addResourceRef(ctx, texture.resourceId);
      }

      if (_baseColorTexture) {
        disposeResource(ctx, _baseColorTexture.resourceId);
      }

      _baseColorTexture = texture;
      materialBufferView.baseColorTexture[0] = texture ? texture.resourceId : 0;
    },
    get metallicFactor(): number {
      return materialBufferView.metallicFactor[0];
    },
    set metallicFactor(value: number) {
      materialBufferView.metallicFactor[0] = value;
    },
    get roughnessFactor(): number {
      return materialBufferView.roughnessFactor[0];
    },
    set roughnessFactor(value: number) {
      materialBufferView.roughnessFactor[0] = value;
    },
    get metallicRoughnessTexture(): RemoteTexture | undefined {
      return _metallicRoughnessTexture;
    },
    set metallicRoughnessTexture(texture: RemoteTexture | undefined) {
      if (texture) {
        addResourceRef(ctx, texture.resourceId);
      }

      if (_metallicRoughnessTexture) {
        disposeResource(ctx, _metallicRoughnessTexture.resourceId);
      }

      _metallicRoughnessTexture = texture;
      materialBufferView.metallicRoughnessTexture[0] = texture ? texture.resourceId : 0;
    },
    get normalTextureScale(): number {
      return materialBufferView.normalTextureScale[0];
    },
    set normalTextureScale(value: number) {
      materialBufferView.normalTextureScale[0] = value;
    },
    get normalTexture(): RemoteTexture | undefined {
      return _normalTexture;
    },
    set normalTexture(texture: RemoteTexture | undefined) {
      if (texture) {
        addResourceRef(ctx, texture.resourceId);
      }

      if (_normalTexture) {
        disposeResource(ctx, _normalTexture.resourceId);
      }

      _normalTexture = texture;
      materialBufferView.normalTexture[0] = texture ? texture.resourceId : 0;
    },
    get occlusionTextureStrength(): number {
      return materialBufferView.occlusionTextureStrength[0];
    },
    set occlusionTextureStrength(value: number) {
      materialBufferView.occlusionTextureStrength[0] = value;
    },
    get occlusionTexture(): RemoteTexture | undefined {
      return _occlusionTexture;
    },
    set occlusionTexture(texture: RemoteTexture | undefined) {
      if (texture) {
        addResourceRef(ctx, texture.resourceId);
      }

      if (_occlusionTexture) {
        disposeResource(ctx, _occlusionTexture.resourceId);
      }

      _occlusionTexture = texture;
      materialBufferView.occlusionTexture[0] = texture ? texture.resourceId : 0;
    },
    get emissiveFactor(): vec3 {
      return materialBufferView.emissiveFactor;
    },
    set emissiveFactor(value: vec3) {
      materialBufferView.emissiveFactor.set(value);
    },
    get emissiveTexture(): RemoteTexture | undefined {
      return _emissiveTexture;
    },
    set emissiveTexture(texture: RemoteTexture | undefined) {
      if (texture) {
        addResourceRef(ctx, texture.resourceId);
      }

      if (_emissiveTexture) {
        disposeResource(ctx, _emissiveTexture.resourceId);
      }

      _emissiveTexture = texture;
      materialBufferView.emissiveTexture[0] = texture ? texture.resourceId : 0;
    },
  };

  rendererModule.standardMaterials.push(remoteMaterial);

  return remoteMaterial;
}
