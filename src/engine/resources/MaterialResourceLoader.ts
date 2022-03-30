import {
  MeshBasicMaterial,
  Material,
  Color,
  MeshBasicMaterialParameters,
  FrontSide,
  DoubleSide,
} from "three";
import {
  RemoteResourceManager,
  loadRemoteResource,
  RemoteResourceLoader,
} from "./RemoteResourceManager";
import {
  loadResource,
  ResourceDefinition,
  ResourceLoader,
  ResourceManager,
} from "./ResourceManager";

const MATERIAL_RESOURCE = "material";

export enum MaterialType {
  Unlit = "unlit",
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
  baseColorMapResourceId?: number;
  doubleSided?: boolean;
  alphaCutoff?: number;
  alphaMode?: MaterialAlphaMode;
}
export interface UnlitMaterialDefinition extends IMaterialDefinition {
  materialType: MaterialType.Unlit;
}

export type MaterialDefinition = UnlitMaterialDefinition;

export function MaterialResourceLoader(
  manager: ResourceManager
): ResourceLoader<MaterialDefinition, Material> {
  return {
    type: MATERIAL_RESOURCE,
    async load(def) {
      let material: Material;

      switch (def.materialType) {
        case MaterialType.Unlit:
          const meshBasicMaterialParams: MeshBasicMaterialParameters = {
            color: def.baseColorFactor
              ? new Color().fromArray(def.baseColorFactor)
              : 0xffffff,
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
              meshBasicMaterialParams.alphaTest =
                def.alphaCutoff !== undefined ? def.alphaCutoff : 0.5;
            }
          }

          if (def.baseColorMapResourceId !== undefined) {
            meshBasicMaterialParams.map = await loadResource(
              manager,
              def.baseColorMapResourceId
            );
          }

          material = new MeshBasicMaterial(meshBasicMaterialParams);
          break;
        default:
          throw new Error(`Unknown material type ${def.materialType}`);
      }

      material.name = def.name!;

      return {
        name: def.name,
        resource: material,
      };
    },
  };
}

export function MaterialRemoteResourceLoader(
  manager: RemoteResourceManager
): RemoteResourceLoader {
  return {
    type: MATERIAL_RESOURCE,
  };
}

export function createRemoteMaterial(
  manager: RemoteResourceManager,
  materialDef: MaterialDefinition,
): number {
  return loadRemoteResource(manager, materialDef);
}
