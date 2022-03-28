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
  asyncLoadResource,
  ResourceDefinition,
  ResourceLoader,
  ResourceManager,
} from "./ResourceManager";

const MATERIAL_RESOURCE = "material";

export enum MaterialResourceType {
  Unlit = "unlit",
}

export enum MaterialAlphaMode {
  OPAQUE = "OPAQUE",
  MASK = "MASK",
  BLEND = "BLEND",
}

export type IMaterialResourceDefinition = ResourceDefinition & {
  materialType: string;
} & IMaterialResourceParameters;

export interface IMaterialResourceParameters {
  baseColorFactor?: number[];
  baseColorMapResourceId?: number;
  doubleSided?: boolean;
  alphaCutoff?: number;
  alphaMode?: MaterialAlphaMode;
}

export interface UnlitMaterialResourceParameters
  extends IMaterialResourceParameters {}

export interface UnlitMaterialResourceDefinition
  extends IMaterialResourceDefinition {
  materialType: MaterialResourceType.Unlit;
}

export type MaterialResourceDefinition = UnlitMaterialResourceDefinition;

export function MaterialResourceLoader(
  manager: ResourceManager
): ResourceLoader<MaterialResourceDefinition, Material> {
  return {
    type: MATERIAL_RESOURCE,
    async load(def) {
      let material: Material;

      switch (def.materialType) {
        case MaterialResourceType.Unlit:
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
            meshBasicMaterialParams.map = await asyncLoadResource(
              manager,
              def.baseColorMapResourceId
            );
          }

          material = new MeshBasicMaterial(meshBasicMaterialParams);
          break;
        default:
          throw new Error(`Unknown geometry type ${def.geometryType}`);
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

export function createRemoteUnlitMaterial(
  manager: RemoteResourceManager,
  parameters: UnlitMaterialResourceParameters,
  name?: string
): number {
  return loadRemoteResource(manager, {
    type: MATERIAL_RESOURCE,
    materialType: MaterialResourceType.Unlit,
    ...parameters,
    name,
  });
}
