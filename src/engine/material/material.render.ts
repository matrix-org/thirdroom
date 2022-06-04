import {
  Color,
  DoubleSide,
  FrontSide,
  MeshBasicMaterial,
  MeshBasicMaterialParameters,
  MeshStandardMaterial,
  MeshStandardMaterialParameters,
  Texture,
  Vector2,
} from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { defineModule, getModule } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource, registerResourceLoader, waitForLocalResource } from "../resource/resource.render";
import {
  SharedUnlitMaterial,
  MaterialType,
  SharedStandardMaterial,
  UnlitMaterialResourceType,
  StandardMaterialResourceType,
  SharedUnlitMaterialResource,
  MaterialAlphaMode,
  SharedStandardMaterialResource,
} from "./material.common";

export interface LocalUnlitMaterialResource {
  type: MaterialType.Unlit;
  baseColorTextureResourceId: number;
  material: MeshBasicMaterial;
  sharedMaterial: SharedUnlitMaterial;
  forceUpdate: boolean;
}

export interface LocalStandardMaterialResource {
  type: MaterialType.Standard;
  baseColorTextureResourceId: number;
  metallicRoughnessTextureResourceId: number;
  normalTextureResourceId: number;
  occlusionTextureResourceId: number;
  emissiveTextureResourceId: number;
  material: MeshStandardMaterial;
  sharedMaterial: SharedStandardMaterial;
  forceUpdate: boolean;
}

export type LocalMaterialResource = LocalUnlitMaterialResource | LocalStandardMaterialResource;

export type MaterialModuleState = {
  unlitMaterials: LocalUnlitMaterialResource[];
  standardMaterials: LocalStandardMaterialResource[];
};

export const MaterialModule = defineModule<RenderThreadState, MaterialModuleState>({
  name: "material",
  create() {
    return {
      unlitMaterials: [],
      standardMaterials: [],
    };
  },
  init(ctx) {
    const disposables = [
      registerResourceLoader(ctx, UnlitMaterialResourceType, onLoadUnlitMaterial),
      registerResourceLoader(ctx, StandardMaterialResourceType, onLoadStandardMaterial),
    ];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

async function onLoadUnlitMaterial(
  ctx: RenderThreadState,
  id: ResourceId,
  { type, initialProps, sharedMaterial }: SharedUnlitMaterialResource
): Promise<MeshBasicMaterial> {
  const materialModule = getModule(ctx, MaterialModule);

  const params: MeshBasicMaterialParameters = {
    color: new Color().fromArray(initialProps.baseColorFactor),
    opacity: initialProps.baseColorFactor[3],
    side: initialProps.doubleSided ? DoubleSide : FrontSide,
    transparent: initialProps.alphaMode === MaterialAlphaMode.BLEND,
    depthWrite: initialProps.alphaMode !== MaterialAlphaMode.BLEND,
    alphaTest: initialProps.alphaMode === MaterialAlphaMode.MASK ? initialProps.alphaCutoff : undefined,
  };

  if (initialProps.baseColorTexture) {
    params.map = await waitForLocalResource<Texture>(ctx, initialProps.baseColorTexture);
  }

  const material = new MeshBasicMaterial(params);

  materialModule.unlitMaterials.push({
    type,
    baseColorTextureResourceId: initialProps.baseColorTexture,
    material,
    sharedMaterial,
    forceUpdate: true,
  });

  return material;
}

async function onLoadStandardMaterial(
  ctx: RenderThreadState,
  id: ResourceId,
  { type, initialProps, sharedMaterial }: SharedStandardMaterialResource
): Promise<MeshStandardMaterial> {
  const materialModule = getModule(ctx, MaterialModule);

  const params: MeshStandardMaterialParameters = {
    color: new Color().fromArray(initialProps.baseColorFactor),
    opacity: initialProps.baseColorFactor[3],
    side: initialProps.doubleSided ? DoubleSide : FrontSide,
    transparent: initialProps.alphaMode === MaterialAlphaMode.BLEND,
    depthWrite: initialProps.alphaMode !== MaterialAlphaMode.BLEND,
    alphaTest: initialProps.alphaMode === MaterialAlphaMode.MASK ? initialProps.alphaCutoff : 0,
    metalness: initialProps.metallicFactor,
    roughness: initialProps.roughnessFactor,
    normalScale: new Vector2().setScalar(initialProps.normalTextureScale),
    aoMapIntensity: initialProps.occlusionTextureStrength,
    emissive: new Color().fromArray(initialProps.emissiveFactor),
  };

  const promises: Promise<void>[] = [];

  if (initialProps.baseColorTexture) {
    promises.push(
      waitForLocalResource<Texture>(ctx, initialProps.baseColorTexture).then((texture) => {
        params.map = texture;
      })
    );
  }

  if (initialProps.metallicRoughnessTexture !== undefined) {
    promises.push(
      waitForLocalResource<Texture>(ctx, initialProps.metallicRoughnessTexture).then((texture) => {
        params.metalnessMap = texture;
        params.roughnessMap = texture;
      })
    );
  }

  if (initialProps.normalTexture !== undefined) {
    promises.push(
      waitForLocalResource<Texture>(ctx, initialProps.normalTexture).then((texture) => {
        params.normalMap = texture;
      })
    );
  }

  if (initialProps.occlusionTexture !== undefined) {
    promises.push(
      waitForLocalResource<Texture>(ctx, initialProps.occlusionTexture).then((texture) => {
        params.aoMap = texture;
      })
    );
  }

  if (initialProps.emissiveTexture !== undefined) {
    promises.push(
      waitForLocalResource<Texture>(ctx, initialProps.emissiveTexture).then((texture) => {
        params.emissiveMap = texture;
      })
    );
  }

  await Promise.all(promises);

  const material = new MeshStandardMaterial(params);

  materialModule.standardMaterials.push({
    type,
    baseColorTextureResourceId: initialProps.baseColorTexture,
    metallicRoughnessTextureResourceId: initialProps.metallicRoughnessTexture,
    normalTextureResourceId: initialProps.normalTexture,
    occlusionTextureResourceId: initialProps.occlusionTexture,
    emissiveTextureResourceId: initialProps.emissiveTexture,
    material,
    sharedMaterial,
    forceUpdate: true,
  });

  return material;
}

export function MaterialUpdateSystem(ctx: RenderThreadState) {
  const materialModule = getModule(ctx, MaterialModule);
  updateUnlitMaterials(ctx, materialModule);
  updateStandardMaterials(ctx, materialModule);
}

function updateUnlitMaterials(ctx: RenderThreadState, materialModule: MaterialModuleState) {
  for (let i = 0; i < materialModule.unlitMaterials.length; i++) {
    const unlitMaterial = materialModule.unlitMaterials[i];

    const { baseColorTextureResourceId, material, sharedMaterial, forceUpdate } = unlitMaterial;

    const props = getReadObjectBufferView(sharedMaterial);

    if (!props.needsUpdate[0] || forceUpdate) {
      continue;
    }

    material.color.fromArray(props.baseColorFactor);
    material.opacity = props.baseColorFactor[3];
    material.side = props.doubleSided[0] ? DoubleSide : FrontSide;
    material.transparent = props.alphaMode[0] === MaterialAlphaMode.BLEND;
    material.depthWrite = props.alphaMode[0] !== MaterialAlphaMode.BLEND;
    material.alphaTest = props.alphaMode[0] === MaterialAlphaMode.MASK ? props.alphaCutoff[0] : 0;

    if (props.baseColorTexture[0] !== baseColorTextureResourceId) {
      const resourceId = props.baseColorTexture[0];
      const textureResource = getLocalResource<Texture>(ctx, resourceId);

      if (textureResource && textureResource.resource) {
        material.map = textureResource.resource;
      } else {
        waitForLocalResource<Texture>(ctx, props.baseColorTexture[0]).then((texture) => {
          const currentProps = getReadObjectBufferView(sharedMaterial);

          if (currentProps.baseColorTexture[0] === resourceId) {
            material.map = texture;
          }
        });
      }
    }
  }
}

function updateStandardMaterials(ctx: RenderThreadState, materialModule: MaterialModuleState) {
  for (let i = 0; i < materialModule.standardMaterials.length; i++) {
    const standardMaterial = materialModule.standardMaterials[i];

    const {
      baseColorTextureResourceId,
      metallicRoughnessTextureResourceId,
      normalTextureResourceId,
      occlusionTextureResourceId,
      emissiveTextureResourceId,
      material,
      sharedMaterial,
      forceUpdate,
    } = standardMaterial;

    const props = getReadObjectBufferView(sharedMaterial);

    if (!props.needsUpdate[0] || forceUpdate) {
      continue;
    }

    material.color.fromArray(props.baseColorFactor);
    material.opacity = props.baseColorFactor[3];
    material.side = props.doubleSided[0] ? DoubleSide : FrontSide;
    material.transparent = props.alphaMode[0] === MaterialAlphaMode.BLEND;
    material.depthWrite = props.alphaMode[0] !== MaterialAlphaMode.BLEND;
    material.alphaTest = props.alphaMode[0] === MaterialAlphaMode.MASK ? props.alphaCutoff[0] : 0;
    material.metalness = props.metallicFactor[0];
    material.roughness = props.roughnessFactor[0];
    material.normalScale.setScalar(props.normalTextureScale[0]);
    material.aoMapIntensity = props.occlusionTextureStrength[0];
    material.emissive.fromArray(props.emissiveFactor);

    if (props.baseColorTexture[0] !== baseColorTextureResourceId) {
      const resourceId = props.baseColorTexture[0];
      const textureResource = getLocalResource<Texture>(ctx, resourceId);

      if (textureResource && textureResource.resource) {
        material.map = textureResource.resource;
        standardMaterial.baseColorTextureResourceId = resourceId;
      } else {
        waitForLocalResource<Texture>(ctx, props.baseColorTexture[0]).then((texture) => {
          const currentProps = getReadObjectBufferView(sharedMaterial);

          if (currentProps.baseColorTexture[0] === resourceId) {
            material.map = texture;
            standardMaterial.baseColorTextureResourceId = resourceId;
          }
        });
      }
    }

    if (props.metallicRoughnessTexture[0] !== metallicRoughnessTextureResourceId) {
      const resourceId = props.metallicRoughnessTexture[0];
      const textureResource = getLocalResource<Texture>(ctx, resourceId);

      if (textureResource && textureResource.resource) {
        material.metalnessMap = textureResource.resource;
        material.roughnessMap = textureResource.resource;
        standardMaterial.metallicRoughnessTextureResourceId = resourceId;
      } else {
        waitForLocalResource<Texture>(ctx, props.metallicRoughnessTexture[0]).then((texture) => {
          const currentProps = getReadObjectBufferView(sharedMaterial);

          if (currentProps.metallicRoughnessTexture[0] === resourceId) {
            material.metalnessMap = texture;
            material.roughnessMap = texture;
            standardMaterial.metallicRoughnessTextureResourceId = resourceId;
          }
        });
      }
    }

    if (props.normalTexture[0] !== normalTextureResourceId) {
      const resourceId = props.normalTexture[0];
      const textureResource = getLocalResource<Texture>(ctx, resourceId);

      if (textureResource && textureResource.resource) {
        material.normalMap = textureResource.resource;
        standardMaterial.normalTextureResourceId = resourceId;
      } else {
        waitForLocalResource<Texture>(ctx, props.normalTexture[0]).then((texture) => {
          const currentProps = getReadObjectBufferView(sharedMaterial);

          if (currentProps.normalTexture[0] === resourceId) {
            material.normalMap = texture;
            standardMaterial.normalTextureResourceId = resourceId;
          }
        });
      }
    }

    if (props.occlusionTexture[0] !== occlusionTextureResourceId) {
      const resourceId = props.occlusionTexture[0];
      const textureResource = getLocalResource<Texture>(ctx, resourceId);

      if (textureResource && textureResource.resource) {
        material.aoMap = textureResource.resource;
        standardMaterial.occlusionTextureResourceId = resourceId;
      } else {
        waitForLocalResource<Texture>(ctx, props.occlusionTexture[0]).then((texture) => {
          const currentProps = getReadObjectBufferView(sharedMaterial);

          if (currentProps.occlusionTexture[0] === resourceId) {
            material.aoMap = texture;
            standardMaterial.occlusionTextureResourceId = resourceId;
          }
        });
      }
    }

    if (props.emissiveTexture[0] !== emissiveTextureResourceId) {
      const resourceId = props.emissiveTexture[0];
      const textureResource = getLocalResource<Texture>(ctx, resourceId);

      if (textureResource && textureResource.resource) {
        material.emissiveMap = textureResource.resource;
        standardMaterial.emissiveTextureResourceId = resourceId;
      } else {
        waitForLocalResource<Texture>(ctx, props.emissiveTexture[0]).then((texture) => {
          const currentProps = getReadObjectBufferView(sharedMaterial);

          if (currentProps.emissiveTexture[0] === resourceId) {
            material.emissiveMap = texture;
            standardMaterial.emissiveTextureResourceId = resourceId;
          }
        });
      }
    }
  }
}
