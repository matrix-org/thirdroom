import { LocalAccessor } from "../accessor/accessor.render";
import { LocalMaterialResource } from "../material/material.render";
import { MeshMode } from "./mesh.common";

export interface LocalMeshPrimitive {
  attributes: { [key: string]: LocalAccessor };
  indices?: LocalAccessor;
  material?: LocalMaterialResource;
  mode: MeshMode;
  targets?: number[] | Float32Array;
}

export interface LocalMesh {
  primitives: LocalMeshPrimitive;
}
