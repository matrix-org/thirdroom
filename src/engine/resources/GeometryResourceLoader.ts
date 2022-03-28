import { BoxBufferGeometry, BufferGeometry } from "three";
import { RemoteResourceManager, loadRemoteResource, RemoteResourceLoader } from "./RemoteResourceManager";
import { ResourceDefinition, ResourceLoader, ResourceManager } from "./ResourceManager";

const GEOMETRY_RESOURCE = "geometry";

export enum GeometryResourceType {
  Box = "box",
};

export interface IGeometryResourceDefinition extends ResourceDefinition {
  geometryType: string;
}

export interface BoxGeometryResourceDefinition extends IGeometryResourceDefinition {
  geometryType: GeometryResourceType.Box;
  width?: number;
  height?: number;
  depth?: number;
  widthSegments?: number;
  heightSegments?: number;
  depthSegments?: number;
}

export type GeometryResourceDefinition = BoxGeometryResourceDefinition;

export function GeometryResourceLoader(manager: ResourceManager): ResourceLoader<GeometryResourceDefinition, BufferGeometry> {  
  return {
    type: GEOMETRY_RESOURCE,
    async load(def) {

      let geometry: BufferGeometry;

      switch (def.geometryType) {
        case GeometryResourceType.Box:
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
          throw new Error(`Unknown geometry type ${def.geometryType}`)
      }

      geometry.name = def.name!;

      return {
        name: def.name,
        resource: geometry,
      };
    }
  };
}

export function GeometryRemoteResourceLoader(manager: RemoteResourceManager): RemoteResourceLoader {
  return {
    type: GEOMETRY_RESOURCE,
  };
}

export function createRemoteBoxGeometry(
  manager: RemoteResourceManager,
  width?: number,
  height?: number,
  depth?: number,
  widthSegments?: number,
  heightSegments?: number,
  depthSegments?: number,
  name?: string,
): number {
  return loadRemoteResource(manager, {
    type: GEOMETRY_RESOURCE,
    geometryType: GeometryResourceType.Box,
    width,
    height,
    depth,
    widthSegments,
    heightSegments,
    depthSegments,
    name,
  });
}
