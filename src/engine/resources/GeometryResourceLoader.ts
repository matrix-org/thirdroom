import { BoxBufferGeometry, BufferGeometry } from "three";

import { RemoteResourceManager, loadRemoteResource, RemoteResourceLoader } from "./RemoteResourceManager";
import { ResourceDefinition, ResourceLoader, ResourceManager } from "./ResourceManager";

const GEOMETRY_RESOURCE = "geometry";

export enum GeometryType {
  Box = "box",
}

export interface IGeometryDefinition extends ResourceDefinition {
  type: "geometry";
  geometryType: string;
}

export interface BoxGeometryDefinition extends IGeometryDefinition {
  geometryType: GeometryType.Box;
  width?: number;
  height?: number;
  depth?: number;
  widthSegments?: number;
  heightSegments?: number;
  depthSegments?: number;
}

export type GeometryDefinition = BoxGeometryDefinition;

export function GeometryResourceLoader(manager: ResourceManager): ResourceLoader<GeometryDefinition, BufferGeometry> {
  return {
    type: GEOMETRY_RESOURCE,
    async load(def) {
      let geometry: BufferGeometry;

      switch (def.geometryType) {
        case GeometryType.Box:
          geometry = new BoxBufferGeometry(
            def.width,
            def.height,
            def.depth,
            def.widthSegments,
            def.heightSegments,
            def.depthSegments
          );
          break;
        default:
          throw new Error(`Unknown geometry type ${def.geometryType}`);
      }

      geometry.name = def.name!;

      return {
        name: def.name,
        resource: geometry,
      };
    },
  };
}

export function GeometryRemoteResourceLoader(manager: RemoteResourceManager): RemoteResourceLoader {
  return {
    type: GEOMETRY_RESOURCE,
  };
}

export function createRemoteGeometry(manager: RemoteResourceManager, geometryDef: GeometryDefinition): number {
  return loadRemoteResource(manager, geometryDef);
}
