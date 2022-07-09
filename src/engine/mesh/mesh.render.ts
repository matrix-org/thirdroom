import {
  Mesh,
  BufferGeometry,
  Material,
  Line,
  LineSegments,
  Points,
  LineLoop,
  SkinnedMesh,
  Scene,
  InstancedMesh,
  Vector3,
  Quaternion,
  Matrix4,
} from "three";

import { LocalAccessor } from "../accessor/accessor.render";
import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
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
import { RendererNodeTripleBuffer } from "../node/node.common";
import { LocalNode, updateTransformFromNode } from "../node/node.render";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource, getResourceDisposed, waitForLocalResource } from "../resource/resource.render";
import { promiseObject } from "../utils/promiseObject";
import { toTrianglesDrawMode } from "../utils/toTrianglesDrawMode";
import {
  InstancedMeshAttribute,
  MeshPrimitiveAttribute,
  MeshPrimitiveMode,
  MeshPrimitiveTripleBuffer,
  SharedInstancedMeshResource,
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
  targets?: number[] | Float32Array;
  geometryObj: BufferGeometry;
  materialObj: Material;
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

const ThreeAttributes: { [key: string]: string } = {
  [MeshPrimitiveAttribute.POSITION]: "position",
  [MeshPrimitiveAttribute.NORMAL]: "normal",
  [MeshPrimitiveAttribute.TANGENT]: "tangent",
  [MeshPrimitiveAttribute.TEXCOORD_0]: "uv",
  [MeshPrimitiveAttribute.TEXCOORD_1]: "uv2",
  [MeshPrimitiveAttribute.COLOR_0]: "color",
  [MeshPrimitiveAttribute.JOINTS_0]: "skinWeight",
  [MeshPrimitiveAttribute.WEIGHTS_0]: "skinIndex",
};

export async function onLoadLocalMeshPrimitiveResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { initialProps, meshPrimitiveTripleBuffer }: SharedMeshPrimitiveResource
): Promise<LocalMeshPrimitive> {
  const rendererModule = getModule(ctx, RendererModule);

  const meshPrimitiveView = getReadObjectBufferView(meshPrimitiveTripleBuffer);

  const attributePromises: { [key: string]: Promise<LocalAccessor> } = {};

  for (const attributeName in initialProps.attributes) {
    attributePromises[attributeName] = waitForLocalResource(
      ctx,
      initialProps.attributes[attributeName],
      `mesh-primitive.${attributeName} accessor`
    );
  }

  const results = await promiseObject({
    indices: initialProps.indices
      ? waitForLocalResource<LocalAccessor>(ctx, initialProps.indices, "mesh-primitive.indices accessor")
      : undefined,
    attributes: promiseObject(attributePromises),
    material: meshPrimitiveView.material[0]
      ? waitForLocalResource<LocalMaterialResource>(ctx, meshPrimitiveView.material[0], "mesh-primitive material")
      : undefined,
  });

  const mode = initialProps.mode;

  let geometry = new BufferGeometry();

  if (results.indices) {
    if ("isInterleavedBufferAttribute" in results.indices.attribute) {
      throw new Error("Interleaved attributes are not supported as mesh indices.");
    }

    geometry.setIndex(results.indices.attribute);
  }

  for (const attributeName in results.attributes) {
    geometry.setAttribute(ThreeAttributes[attributeName], results.attributes[attributeName].attribute);
  }

  if (mode === MeshPrimitiveMode.TRIANGLE_STRIP) {
    geometry = toTrianglesDrawMode(geometry, MeshPrimitiveMode.TRIANGLE_STRIP);
  } else if (mode === MeshPrimitiveMode.TRIANGLE_FAN) {
    geometry = toTrianglesDrawMode(geometry, MeshPrimitiveMode.TRIANGLE_FAN);
  }

  let material: Material;

  if (!results.material) {
    material = createDefaultMaterial(results.attributes);
  } else if (results.material.type === MaterialType.Unlit) {
    material = createPrimitiveUnlitMaterial(mode, results.attributes, results.material);
  } else if (results.material.type === MaterialType.Standard) {
    material = createPrimitiveStandardMaterial(mode, results.attributes, results.material);
  } else {
    throw new Error("Unsupported material type");
  }

  const localMeshPrimitive: LocalMeshPrimitive = {
    resourceId,
    mode,
    attributes: results.attributes,
    indices: results.indices,
    material: results.material,
    geometryObj: geometry,
    materialObj: material,
    meshPrimitiveTripleBuffer,
  };

  rendererModule.meshPrimitives.push(localMeshPrimitive);

  return localMeshPrimitive;
}

export interface LocalInstancedMesh {
  resourceId: ResourceId;
  attributes: { [key: string]: LocalAccessor };
}

export async function onLoadLocalInstancedMeshResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  props: SharedInstancedMeshResource
): Promise<LocalInstancedMesh> {
  const attributePromises: { [key: string]: Promise<LocalAccessor> } = {};

  for (const attributeName in props.attributes) {
    attributePromises[attributeName] = waitForLocalResource(
      ctx,
      props.attributes[attributeName],
      `instanced-mesh.${attributeName} accessor`
    );
  }

  const attributes = await promiseObject(attributePromises);

  const localInstancedMesh: LocalInstancedMesh = {
    resourceId,
    attributes,
  };

  return localInstancedMesh;
}

const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();
const tempMatrix = new Matrix4();

function createMeshPrimitiveObject(
  primitive: LocalMeshPrimitive,
  instancedMesh?: LocalInstancedMesh
): PrimitiveObject3D {
  let object: PrimitiveObject3D;

  const { mode, geometryObj, materialObj } = primitive;

  if (
    mode === MeshPrimitiveMode.TRIANGLES ||
    mode === MeshPrimitiveMode.TRIANGLE_FAN ||
    mode === MeshPrimitiveMode.TRIANGLE_STRIP
  ) {
    // todo: skinned mesh
    const isSkinnedMesh = false;

    let mesh: Mesh | InstancedMesh | SkinnedMesh;

    if (isSkinnedMesh) {
      mesh = new SkinnedMesh(geometryObj, materialObj);
    } else if (instancedMesh) {
      const attributes = Object.entries(instancedMesh.attributes);
      const count = attributes[0][1].attribute.count;

      const instancedMeshObject = new InstancedMesh(geometryObj, materialObj, count);
      instancedMeshObject.frustumCulled = false;

      tempPosition.set(0, 0, 0);
      tempQuaternion.set(0, 0, 0, 1);
      tempScale.set(1, 1, 1);

      for (let instanceIndex = 0; instanceIndex < count; instanceIndex++) {
        if (instancedMesh.attributes[InstancedMeshAttribute.TRANSLATION]) {
          tempPosition.fromBufferAttribute(
            instancedMesh.attributes[InstancedMeshAttribute.TRANSLATION].attribute,
            instanceIndex
          );
        }

        if (instancedMesh.attributes[InstancedMeshAttribute.ROTATION]) {
          // TODO: Add fromBufferAttribute to Quaternion types
          (tempQuaternion as any).fromBufferAttribute(
            instancedMesh.attributes[InstancedMeshAttribute.ROTATION].attribute,
            instanceIndex
          );
        }

        if (instancedMesh.attributes[InstancedMeshAttribute.SCALE]) {
          tempScale.fromBufferAttribute(
            instancedMesh.attributes[InstancedMeshAttribute.SCALE].attribute,
            instanceIndex
          );
        }

        instancedMeshObject.setMatrixAt(instanceIndex, tempMatrix.compose(tempPosition, tempQuaternion, tempScale));
      }

      mesh = instancedMeshObject;
    } else {
      mesh = new Mesh(geometryObj, materialObj);
    }

    if (mesh instanceof SkinnedMesh && !mesh.geometry.attributes.skinWeight.normalized) {
      // we normalize floating point skin weight array to fix malformed assets (see #15319)
      // it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
      mesh.normalizeSkinWeights();
    }

    object = mesh;
  } else if (mode === MeshPrimitiveMode.LINES) {
    object = new LineSegments(geometryObj, materialObj);
  } else if (mode === MeshPrimitiveMode.LINE_STRIP) {
    object = new Line(geometryObj, materialObj);
  } else if (mode === MeshPrimitiveMode.LINE_LOOP) {
    object = new LineLoop(geometryObj, materialObj);
  } else if (mode === MeshPrimitiveMode.POINTS) {
    object = new Points(geometryObj, materialObj);
  } else {
    throw new Error(`Primitive mode ${mode} unsupported.`);
  }

  if (
    (object.material as any).aoMap &&
    object.geometry.attributes.uv2 === undefined &&
    object.geometry.attributes.uv !== undefined
  ) {
    object.geometry.setAttribute("uv2", object.geometry.attributes.uv);
  }

  // TODO: Move to glTF extension
  object.castShadow = true;
  object.receiveShadow = true;

  return object;
}

/* Updates */

export function updateLocalMeshPrimitiveResources(ctx: RenderThreadState, meshPrimitives: LocalMeshPrimitive[]) {
  for (let i = meshPrimitives.length - 1; i >= 0; i--) {
    const meshPrimitiveResource = meshPrimitives[i];

    if (getResourceDisposed(ctx, meshPrimitiveResource.resourceId)) {
      meshPrimitiveResource.geometryObj.dispose();
      meshPrimitiveResource.materialObj.dispose();
      meshPrimitives.splice(i, 1);
    }
  }

  for (let i = 0; i < meshPrimitives.length; i++) {
    const meshPrimitive = meshPrimitives[i];
    const sharedMeshPrimitive = getReadObjectBufferView(meshPrimitive.meshPrimitiveTripleBuffer);

    const currentMaterialResourceId = meshPrimitive.material?.resourceId || 0;
    const nextMaterialResourceId = sharedMeshPrimitive.material[0];

    const nextMaterialResource = getLocalResource<LocalMaterialResource>(ctx, nextMaterialResourceId)?.resource;

    if (currentMaterialResourceId !== nextMaterialResourceId) {
      if (!nextMaterialResource) {
        meshPrimitive.materialObj = createDefaultMaterial(meshPrimitive.attributes);
      } else if (nextMaterialResource.type === MaterialType.Unlit) {
        meshPrimitive.materialObj = createPrimitiveUnlitMaterial(
          meshPrimitive.mode,
          meshPrimitive.attributes,
          nextMaterialResource
        );
      } else if (nextMaterialResource.type === MaterialType.Standard) {
        meshPrimitive.materialObj = createPrimitiveStandardMaterial(
          meshPrimitive.mode,
          meshPrimitive.attributes,
          nextMaterialResource
        );
      }

      if (
        (meshPrimitive.materialObj as any).aoMap &&
        meshPrimitive.geometryObj.attributes.uv2 === undefined &&
        meshPrimitive.geometryObj.attributes.uv !== undefined
      ) {
        meshPrimitive.geometryObj.setAttribute("uv2", meshPrimitive.geometryObj.attributes.uv);
      }
    }

    if (nextMaterialResource && nextMaterialResource.type === MaterialType.Standard) {
      updateMeshPrimitiveStandardMaterial(meshPrimitive.materialObj as PrimitiveStandardMaterial, nextMaterialResource);
    } else if (nextMaterialResource && nextMaterialResource.type === MaterialType.Unlit) {
      updateMeshPrimitiveUnlitMaterial(meshPrimitive.materialObj as PrimitiveUnlitMaterial, nextMaterialResource);
    }
  }
}

export function updateNodeMesh(
  ctx: RenderThreadState,
  scene: Scene,
  node: LocalNode,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>
) {
  const currentMeshResourceId = node.mesh?.resourceId || 0;
  const nextMeshResourceId = nodeReadView.mesh[0];

  if (currentMeshResourceId !== nextMeshResourceId) {
    if (node.meshPrimitiveObjects) {
      for (let i = 0; i < node.meshPrimitiveObjects.length; i++) {
        const primitiveObject = node.meshPrimitiveObjects[i];
        scene.remove(primitiveObject);
      }

      node.meshPrimitiveObjects = undefined;
    }

    if (nextMeshResourceId) {
      node.mesh = getLocalResource<LocalMesh>(ctx, nextMeshResourceId)?.resource;
    } else {
      node.mesh = undefined;
    }
  }

  // Only apply mesh updates if it's loaded and is set to the same resource as is in the triple buffer
  if (!node.mesh) {
    return;
  }

  if (!node.meshPrimitiveObjects) {
    node.meshPrimitiveObjects = node.mesh.primitives.map((primitive) =>
      createMeshPrimitiveObject(primitive, node.instancedMesh)
    );
    scene.add(...node.meshPrimitiveObjects);
  }

  for (let i = 0; i < node.meshPrimitiveObjects.length; i++) {
    const primitiveObject = node.meshPrimitiveObjects[i];

    const nextMaterial = node.mesh.primitives[i].materialObj;

    if (primitiveObject.material !== nextMaterial) {
      primitiveObject.material = nextMaterial;
    }

    updateTransformFromNode(ctx, nodeReadView, primitiveObject);
  }
}
