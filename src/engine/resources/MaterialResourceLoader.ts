import {
  Texture,
  MeshBasicMaterial,
  Material,
  Color,
  MeshBasicMaterialParameters,
  FrontSide,
  DoubleSide,
  MeshStandardMaterial,
  MeshStandardMaterialParameters,
  Vector2,
} from "three";

import { RemoteResourceManager, loadRemoteResource, RemoteResourceLoader } from "./RemoteResourceManager";
import { loadResource, ResourceDefinition, ResourceLoader, ResourceManager } from "./ResourceManager";

const MATERIAL_RESOURCE = "material";

export enum MaterialType {
  Unlit = "unlit",
  Physical = "physical",
}

export enum MaterialAlphaMode {
  OPAQUE = "OPAQUE",
  MASK = "MASK",
  BLEND = "BLEND",
}

export interface IMaterialDefinition extends ResourceDefinition {
  type: "material";
  materialType: MaterialType;
  baseColorFactor?: number[];
  baseColorTextureResourceId?: number;
  doubleSided?: boolean;
  alphaCutoff?: number;
  alphaMode?: MaterialAlphaMode;
}

export interface UnlitMaterialDefinition extends IMaterialDefinition {
  materialType: MaterialType.Unlit;
}

export interface PhysicalMaterialDefinition extends IMaterialDefinition {
  materialType: MaterialType.Physical;
  metallicFactor?: number;
  roughnessFactor?: number;
  metallicRoughnessTextureResourceId?: number;
  normalTextureScale?: number;
  normalTextureResourceId?: number;
  occlusionTextureStrength?: number;
  occlusionTextureResourceId?: number;
  emissiveFactor?: number[];
  emissiveTextureResourceId?: number;
}

export type MaterialDefinition = UnlitMaterialDefinition | PhysicalMaterialDefinition;

export function MaterialResourceLoader(manager: ResourceManager): ResourceLoader<MaterialDefinition, Material> {
  return {
    type: MATERIAL_RESOURCE,
    async load(def) {
      let material: Material;

      const pending: Promise<void>[] = [];

      const meshBasicMaterialParams: MeshBasicMaterialParameters = {
        color: def.baseColorFactor ? new Color().fromArray(def.baseColorFactor) : 0xffffff,
        opacity: def.baseColorFactor ? def.baseColorFactor[3] : 1.0,
        side: def.doubleSided === true ? DoubleSide : FrontSide,
      };

      const alphaMode = def.alphaMode || MaterialAlphaMode.OPAQUE;

      if (alphaMode === MaterialAlphaMode.BLEND) {
        meshBasicMaterialParams.transparent = true;
        meshBasicMaterialParams.depthWrite = false;
      } else {
        meshBasicMaterialParams.transparent = false;

        if (alphaMode === MaterialAlphaMode.MASK) {
          meshBasicMaterialParams.alphaTest = def.alphaCutoff !== undefined ? def.alphaCutoff : 0.5;
        }
      }

      if (def.baseColorTextureResourceId !== undefined) {
        pending.push(
          loadResource<Texture>(manager, def.baseColorTextureResourceId).then((texture) => {
            meshBasicMaterialParams.map = texture;
          })
        );
      }

      switch (def.materialType) {
        case MaterialType.Unlit:
          material = new MeshBasicMaterial(meshBasicMaterialParams);
          break;
        case MaterialType.Physical: {
          const meshStandardMaterialParams: MeshStandardMaterialParameters = {
            ...meshBasicMaterialParams,
            metalness: def.metallicFactor === undefined ? 1 : def.metallicFactor,
            roughness: def.roughnessFactor === undefined ? 1 : def.roughnessFactor,
            normalScale:
              def.normalTextureScale === undefined
                ? new Vector2(1, 1)
                : new Vector2().setScalar(def.normalTextureScale),
            aoMapIntensity: def.occlusionTextureStrength === undefined ? 1 : def.occlusionTextureStrength,
            emissive: def.emissiveFactor === undefined ? 0x000000 : new Color().fromArray(def.emissiveFactor),
          };

          if (def.metallicRoughnessTextureResourceId !== undefined) {
            pending.push(
              loadResource<Texture>(manager, def.metallicRoughnessTextureResourceId).then((texture) => {
                meshStandardMaterialParams.metalnessMap = texture;
                meshStandardMaterialParams.roughnessMap = texture;
              })
            );
          }

          if (def.normalTextureResourceId !== undefined) {
            pending.push(
              loadResource<Texture>(manager, def.normalTextureResourceId).then((texture) => {
                meshStandardMaterialParams.normalMap = texture;
              })
            );
          }

          if (def.occlusionTextureResourceId !== undefined) {
            pending.push(
              loadResource<Texture>(manager, def.occlusionTextureResourceId).then((texture) => {
                meshStandardMaterialParams.aoMap = texture;
              })
            );
          }

          if (def.emissiveTextureResourceId !== undefined) {
            pending.push(
              loadResource<Texture>(manager, def.emissiveTextureResourceId).then((texture) => {
                meshStandardMaterialParams.emissiveMap = texture;
              })
            );
          }

          material = new MeshStandardMaterial(meshStandardMaterialParams);
          break;
        }
        default:
          throw new Error(`Unknown material type ${(def as unknown as any).materialType}`);
      }

      await Promise.all(pending);

      if (def.name) {
        material.name = def.name;
      }

      return {
        name: def.name,
        resource: material,
      };
    },
  };
}

export function MaterialRemoteResourceLoader(manager: RemoteResourceManager): RemoteResourceLoader {
  return {
    type: MATERIAL_RESOURCE,
  };
}

export function createRemoteMaterial(manager: RemoteResourceManager, materialDef: MaterialDefinition): number {
  return loadRemoteResource(manager, materialDef);
}
