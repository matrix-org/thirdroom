import { BoxBufferGeometry, BufferAttribute, BufferGeometry } from "three";

import { ResourceDefinition, ResourceLoader, ResourceManager } from "./ResourceManager";

const GEOMETRY_RESOURCE = "geometry";

export enum GeometryType {
  Box = "box",
  Buffer = "buffer",
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

export interface BufferGeometryDefinition extends IGeometryDefinition {
  geometryType: GeometryType.Buffer;
  index: Int32Array;
  position: Float32Array;
}

export type GeometryDefinition = BoxGeometryDefinition | BufferGeometryDefinition;

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
        case GeometryType.Buffer:
          geometry = new BufferGeometry();
          geometry.setIndex(new BufferAttribute(def.index, 1));
          geometry.setAttribute("position", new BufferAttribute(def.position, 3));
          break;
        default:
          throw new Error(`Unknown geometry type ${(def as unknown as any).geometryType}`);
      }

      if (def.name) {
        geometry.name = def.name;
      }

      return {
        name: def.name,
        resource: geometry,
      };
    },
  };
}
