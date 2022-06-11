import { Mesh, BufferGeometry, Material, Line, LineSegments, Points, LineLoop, SkinnedMesh } from "three";

import { LocalAccessor } from "../accessor/accessor.render";
import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { MaterialType } from "../material/material.common";
import {
  createDefaultMaterial,
  createPrimitiveStandardMaterial,
  createPrimitiveUnlitMaterial,
  LocalMaterialResource,
  PrimitiveStandardMaterial,
  PrimitiveUnlitMaterial,
  updatePrimitiveStandardMaterial as updateMeshPrimitiveStandardMaterial,
  updatePrimitiveUnlitMaterial as updateMeshPrimitiveUnlitMaterial,
} from "../material/material.render";
import { getModule } from "../module/module.common";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource, waitForLocalResource } from "../resource/resource.render";
import { promiseObject } from "../utils/promiseObject";
import { toTrianglesDrawMode } from "../utils/toTrianglesDrawMode";
import {
  MeshPrimitiveMode,
  MeshPrimitiveTripleBuffer,
  SharedMeshPrimitiveResource,
  SharedMeshResource,
} from "./mesh.common";

export type PrimitiveObject3D = SkinnedMesh | Mesh | Line | LineSegments | LineLoop | Points;

export interface LocalMeshPrimitive {
  resourceId: ResourceId;
  attributes: { [key: string]: LocalAccessor };
  mode: MeshPrimitiveMode;
  indices?: LocalAccessor;
  material?: LocalMaterialResource;
  object: PrimitiveObject3D;
  targets?: number[] | Float32Array;
  meshPrimitiveTripleBuffer: MeshPrimitiveTripleBuffer;
}

export interface LocalMesh {
  resourceId: ResourceId;
  primitives: LocalMeshPrimitive[];
}

export async function onLoadLocalMeshResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { initialProps }: SharedMeshResource
): Promise<LocalMesh> {
  return {
    resourceId,
    primitives: await Promise.all(
      initialProps.primitives.map((primitiveResourceId) =>
        waitForLocalResource<LocalMeshPrimitive>(ctx, primitiveResourceId)
      )
    ),
  };
}

export async function onLoadLocalMeshPrimitiveResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { initialProps, meshPrimitiveTripleBuffer }: SharedMeshPrimitiveResource
): Promise<LocalMeshPrimitive> {
  const rendererModule = getModule(ctx, RendererModule);

  const attributePromises: { [key: string]: Promise<LocalAccessor> } = {};

  for (const attributeName in initialProps.attributes) {
    attributePromises[attributeName] = waitForLocalResource(ctx, initialProps.attributes[attributeName]);
  }

  const results = await promiseObject({
    indices: initialProps.indices ? waitForLocalResource<LocalAccessor>(ctx, initialProps.indices) : undefined,
    attributes: promiseObject(attributePromises),
    material: initialProps.material
      ? waitForLocalResource<LocalMaterialResource>(ctx, initialProps.material)
      : undefined,
  });

  const geometry = new BufferGeometry();

  if (results.indices) {
    if ("isInterleavedBufferAttribute" in results.indices.attribute) {
      throw new Error("Interleaved attributes are not supported as mesh indices.");
    }

    geometry.setIndex(results.indices.attribute);
  }

  for (const attributeName in results.attributes) {
    geometry.setAttribute(attributeName, results.attributes[attributeName].attribute);
  }

  const mode = initialProps.mode;

  let material: Material;

  if (!results.material) {
    material = createDefaultMaterial(initialProps.attributes);
  } else if (results.material.type === MaterialType.Unlit) {
    material = createPrimitiveUnlitMaterial(mode, initialProps.attributes, results.material);
  } else if (results.material.type === MaterialType.Standard) {
    material = createPrimitiveStandardMaterial(mode, initialProps.attributes, results.material);
  } else {
    throw new Error("Unsupported material type");
  }

  let object: PrimitiveObject3D;

  if (
    mode === MeshPrimitiveMode.TRIANGLES ||
    mode === MeshPrimitiveMode.TRIANGLE_FAN ||
    mode === MeshPrimitiveMode.TRIANGLE_STRIP
  ) {
    // todo: skinned mesh
    const isSkinnedMesh = false;
    const mesh = isSkinnedMesh ? new Mesh(geometry, material) : new SkinnedMesh(geometry, material);

    if (mesh instanceof SkinnedMesh && !mesh.geometry.attributes.skinWeight.normalized) {
      // we normalize floating point skin weight array to fix malformed assets (see #15319)
      // it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
      mesh.normalizeSkinWeights();
    }

    if (mode === MeshPrimitiveMode.TRIANGLE_STRIP) {
      mesh.geometry = toTrianglesDrawMode(mesh.geometry, MeshPrimitiveMode.TRIANGLE_STRIP);
    } else if (mode === MeshPrimitiveMode.TRIANGLE_FAN) {
      mesh.geometry = toTrianglesDrawMode(mesh.geometry, MeshPrimitiveMode.TRIANGLE_FAN);
    }

    object = mesh;
  } else if (mode === MeshPrimitiveMode.LINES) {
    object = new LineSegments(geometry, material);
  } else if (mode === MeshPrimitiveMode.LINE_STRIP) {
    object = new Line(geometry, material);
  } else if (mode === MeshPrimitiveMode.LINE_LOOP) {
    object = new LineLoop(geometry, material);
  } else if (mode === MeshPrimitiveMode.POINTS) {
    object = new Points(geometry, material);
  } else {
    throw new Error(`Primitive mode ${mode} unsupported.`);
  }

  const localMeshPrimitive: LocalMeshPrimitive = {
    resourceId,
    object,
    mode,
    attributes: results.attributes,
    indices: results.indices,
    material: results.material,
    targets: initialProps.targets,
    meshPrimitiveTripleBuffer,
  };

  rendererModule.meshPrimitives.push(localMeshPrimitive);

  return localMeshPrimitive;
}

/* Updates */

export function updateLocalMeshPrimitiveResources(ctx: RenderThreadState, meshPrimitives: LocalMeshPrimitive[]) {
  for (let i = 0; i < meshPrimitives.length; i++) {
    const meshPrimitive = meshPrimitives[i];
    const sharedMeshPrimitive = getReadObjectBufferView(meshPrimitive.meshPrimitiveTripleBuffer);

    const currentMaterialResourceId = meshPrimitive.material?.resourceId || 0;
    const nextMaterialResourceId = sharedMeshPrimitive.material[0];

    const nextMaterialResource = getLocalResource<LocalMaterialResource>(ctx, nextMaterialResourceId)?.resource;

    if (currentMaterialResourceId !== nextMaterialResourceId) {
      if (!nextMaterialResource) {
        meshPrimitive.object.material = createDefaultMaterial(meshPrimitive.attributes);
      } else if (nextMaterialResource.type === MaterialType.Unlit) {
        meshPrimitive.object.material = createPrimitiveUnlitMaterial(
          meshPrimitive.mode,
          meshPrimitive.attributes,
          nextMaterialResource
        );
      } else if (nextMaterialResource.type === MaterialType.Standard) {
        meshPrimitive.object.material = createPrimitiveStandardMaterial(
          meshPrimitive.mode,
          meshPrimitive.attributes,
          nextMaterialResource
        );
      }
    }

    if (nextMaterialResource && nextMaterialResource.type === MaterialType.Standard) {
      updateMeshPrimitiveStandardMaterial(
        meshPrimitive.object.material as PrimitiveStandardMaterial,
        nextMaterialResource
      );
    } else if (nextMaterialResource && nextMaterialResource.type === MaterialType.Unlit) {
      updateMeshPrimitiveUnlitMaterial(meshPrimitive.object.material as PrimitiveUnlitMaterial, nextMaterialResource);
    }
  }
}
