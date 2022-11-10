import { vec2 } from "gl-matrix";
import {
  Mesh,
  BufferGeometry,
  Line,
  LineSegments,
  Points,
  LineLoop,
  InstancedMesh,
  Vector3,
  Quaternion,
  Matrix4,
  Bone,
  SkinnedMesh,
  Skeleton,
  MeshStandardMaterial,
  Matrix3,
  Uniform,
  FloatType,
  LinearFilter,
  LinearEncoding,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
} from "three";

import { LocalAccessor } from "../accessor/accessor.render";
import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { GLTFMesh } from "../gltf/GLTF";
import {
  getDefaultMaterialForMeshPrimitive,
  PrimitiveMaterial,
  RendererMaterialResource,
} from "../material/material.render";
import { getModule } from "../module/module.common";
import { RendererNodeTripleBuffer } from "../node/node.common";
import { LocalNode, setTransformFromNode, updateTransformFromNode } from "../node/node.render";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource, getResourceDisposed, waitForLocalResource } from "../resource/resource.render";
import { LocalSceneResource } from "../scene/scene.render";
import { RendererTextureResource } from "../texture/texture.render";
import { promiseObject } from "../utils/promiseObject";
import { toTrianglesDrawMode } from "../utils/toTrianglesDrawMode";
import {
  InstancedMeshAttribute,
  MeshPrimitiveAttribute,
  MeshPrimitiveMode,
  MeshPrimitiveTripleBuffer,
  SharedInstancedMeshResource,
  SharedLightMapResource,
  SharedMeshPrimitiveResource,
  SharedMeshResource,
  SharedSkinnedMeshResource,
} from "./mesh.common";

export type PrimitiveObject3D = SkinnedMesh | Mesh | Line | LineSegments | LineLoop | Points;

export type LocalMeshPrimitiveAttributes = { [key: string]: LocalAccessor };

export interface LocalMeshPrimitive {
  resourceId: ResourceId;
  attributes: { [key: string]: LocalAccessor };
  mode: MeshPrimitiveMode;
  indices?: LocalAccessor;
  material?: RendererMaterialResource;
  targets?: number[] | Float32Array;
  geometryObj: BufferGeometry;
  materialObjResourceId: ResourceId;
  materialObj: PrimitiveMaterial;
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
  [MeshPrimitiveAttribute.JOINTS_0]: "skinIndex",
  [MeshPrimitiveAttribute.WEIGHTS_0]: "skinWeight",
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

  const { indices, attributes, material } = await promiseObject({
    indices: initialProps.indices
      ? waitForLocalResource<LocalAccessor>(ctx, initialProps.indices, "mesh-primitive.indices accessor")
      : undefined,
    attributes: promiseObject(attributePromises),
    material: meshPrimitiveView.material[0]
      ? waitForLocalResource<RendererMaterialResource>(ctx, meshPrimitiveView.material[0], "mesh-primitive material")
      : undefined,
  });

  const mode = initialProps.mode;

  let geometryObj = new BufferGeometry();

  if (indices) {
    if ("isInterleavedBufferAttribute" in indices.attribute) {
      throw new Error("Interleaved attributes are not supported as mesh indices.");
    }

    geometryObj.setIndex(indices.attribute);
  }

  for (const attributeName in attributes) {
    geometryObj.setAttribute(ThreeAttributes[attributeName], attributes[attributeName].attribute);
  }

  if (mode === MeshPrimitiveMode.TRIANGLE_STRIP) {
    geometryObj = toTrianglesDrawMode(geometryObj, MeshPrimitiveMode.TRIANGLE_STRIP);
  } else if (mode === MeshPrimitiveMode.TRIANGLE_FAN) {
    geometryObj = toTrianglesDrawMode(geometryObj, MeshPrimitiveMode.TRIANGLE_FAN);
  }

  let materialObj: PrimitiveMaterial;

  if (!material) {
    materialObj = getDefaultMaterialForMeshPrimitive(ctx, mode, attributes);
  } else {
    materialObj = material.getMaterialForMeshPrimitive(ctx, mode, attributes);
  }

  const localMeshPrimitive: LocalMeshPrimitive = {
    resourceId,
    mode,
    attributes,
    indices,
    material,
    geometryObj,
    materialObjResourceId: material?.resourceId || 0,
    materialObj,
    meshPrimitiveTripleBuffer,
  };

  rendererModule.meshPrimitives.push(localMeshPrimitive);

  return localMeshPrimitive;
}

export interface LocalInstancedMesh {
  resourceId: ResourceId;
  attributes: { [key: string]: LocalAccessor };
}

export interface LocalSkinnedMesh {
  resourceId: ResourceId;
  joints: LocalNode[];
  inverseBindMatrices?: LocalAccessor;
  skeleton?: Skeleton;
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

export interface LocalLightMap {
  resourceId: ResourceId;
  texture: RendererTextureResource;
  offset: vec2;
  scale: vec2;
  intensity: number;
}

export async function onLoadLocalLightMapResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  props: SharedLightMapResource
): Promise<LocalLightMap> {
  const lightMapResource = await waitForLocalResource<RendererTextureResource>(ctx, props.texture, "light-map");

  const localLightMap: LocalLightMap = {
    resourceId,
    texture: lightMapResource,
    offset: props.offset,
    scale: props.scale,
    intensity: props.intensity,
  };

  return localLightMap;
}

export async function onLoadLocalSkinnedMeshResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  props: SharedSkinnedMeshResource
): Promise<LocalSkinnedMesh> {
  const inverseBindMatrices = props.inverseBindMatrices
    ? await waitForLocalResource<LocalAccessor>(ctx, props.inverseBindMatrices)
    : undefined;

  const jointPromises = props.joints.map((rid: ResourceId) => waitForLocalResource<LocalNode>(ctx, rid));

  const joints = await Promise.all(jointPromises);

  const localSkinnedMesh: LocalSkinnedMesh = {
    resourceId,
    joints,
    inverseBindMatrices,
  };

  return localSkinnedMesh;
}

const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();
const tempMatrix4 = new Matrix4();

function createMeshPrimitiveObject(
  ctx: RenderThreadState,
  node: LocalNode,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>,
  sceneResource: LocalSceneResource,
  primitive: LocalMeshPrimitive
): PrimitiveObject3D {
  const rendererModule = getModule(ctx, RendererModule);

  let object: PrimitiveObject3D;

  const { instancedMesh, skinnedMesh, lightMap } = node;
  const { mode, geometryObj, materialObj } = primitive;

  if (
    mode === MeshPrimitiveMode.TRIANGLES ||
    mode === MeshPrimitiveMode.TRIANGLE_FAN ||
    mode === MeshPrimitiveMode.TRIANGLE_STRIP
  ) {
    let mesh: Mesh | InstancedMesh;

    if (skinnedMesh) {
      if (!skinnedMesh.skeleton) {
        const bones = [];
        const boneInverses = [];

        // TODO: remove this and use boneMatrices instead
        for (let j = 0, jl = skinnedMesh.joints.length; j < jl; j++) {
          const jointNode = skinnedMesh.joints[j];

          if (jointNode) {
            const boneReadView = getReadObjectBufferView(jointNode.rendererNodeTripleBuffer);

            const bone = (jointNode.bone = new Bone());
            bones.push(bone);
            sceneResource.scene.add(bone);
            setTransformFromNode(ctx, boneReadView, bone);

            const inverseMatrix = new Matrix4();

            if (skinnedMesh.inverseBindMatrices !== undefined) {
              inverseMatrix.fromArray(skinnedMesh.inverseBindMatrices.attribute.array, j * 16);
            }

            boneInverses.push(inverseMatrix);
          } else {
            throw new Error(`Joint ${skinnedMesh.joints[j]} not found`);
          }
        }

        skinnedMesh.skeleton = new Skeleton(bones, boneInverses);
      }

      const sm = (mesh = new SkinnedMesh(geometryObj, materialObj));

      // TODO: figure out why frustum culling of skinned meshes is affected by the pitch of the camera
      sm.frustumCulled = false;

      setTransformFromNode(ctx, nodeReadView, mesh);

      sm.bind(skinnedMesh.skeleton, sm.matrixWorld);

      if (!sm.geometry.attributes.skinWeight.normalized) {
        // we normalize floating point skin weight array to fix malformed assets (see #15319)
        // it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
        sm.normalizeSkinWeights();
      }

      if (Object.keys(sm.geometry.morphAttributes).length > 0) {
        updateMorphTargets(sm, primitive as unknown as GLTFMesh);
      }
    } else if (instancedMesh) {
      const attributes = Object.entries(instancedMesh.attributes);
      const count = attributes[0][1].attribute.count;

      const instancedGeometry = new InstancedBufferGeometry();
      instancedGeometry.instanceCount = count;

      instancedGeometry.setIndex(geometryObj.getIndex());

      for (const semanticName in MeshPrimitiveAttribute) {
        const attributeName = ThreeAttributes[semanticName];

        if (geometryObj.hasAttribute(attributeName)) {
          instancedGeometry.setAttribute(attributeName, geometryObj.getAttribute(attributeName));
        }
      }

      const instancedMeshObject = new InstancedMesh(instancedGeometry, materialObj, count);
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

        instancedMeshObject.setMatrixAt(instanceIndex, tempMatrix4.compose(tempPosition, tempQuaternion, tempScale));
      }

      if (instancedMesh.attributes[InstancedMeshAttribute.LIGHTMAP_OFFSET]) {
        const lightMapOffset = instancedMesh.attributes[InstancedMeshAttribute.LIGHTMAP_OFFSET].attribute;

        instancedGeometry.setAttribute(
          "lightMapOffset",
          new InstancedBufferAttribute(lightMapOffset.array, lightMapOffset.itemSize, lightMapOffset.normalized, 1)
        );
      }

      if (instancedMesh.attributes[InstancedMeshAttribute.LIGHTMAP_SCALE]) {
        const lightMapScale = instancedMesh.attributes[InstancedMeshAttribute.LIGHTMAP_SCALE].attribute;

        instancedGeometry.setAttribute(
          "lightMapScale",
          new InstancedBufferAttribute(lightMapScale.array, lightMapScale.itemSize, lightMapScale.normalized, 1)
        );
      }

      instancedGeometry.setAttribute(
        "instanceReflectionProbeParams",
        new InstancedBufferAttribute(new Float32Array(count * 3), 3, false, 1)
      );

      mesh = instancedMeshObject;
    } else {
      mesh = new Mesh(geometryObj, materialObj);
    }

    mesh.geometry.computeBoundingBox();

    mesh.userData.reflectionProbeParams = new Vector3();

    if (lightMap) {
      const lightMapTexture = lightMap.texture;
      lightMapTexture.texture.encoding = LinearEncoding; // Cant't use hardware sRGB conversion when using FloatType
      lightMapTexture.texture.type = FloatType;
      lightMapTexture.texture.minFilter = LinearFilter;
      lightMapTexture.texture.generateMipmaps = false;

      mesh.userData.lightMap = lightMap;
    }

    // Patch material with per-mesh uniforms

    mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
      const meshMaterial = material as MeshStandardMaterial;

      if (!meshMaterial.isMeshStandardMaterial) {
        return;
      }

      const lightMap = mesh.userData.lightMap as LocalLightMap | undefined;

      if (lightMap) {
        meshMaterial.lightMapIntensity = lightMap.intensity * Math.PI;

        if (meshMaterial.lightMap === null && lightMap.texture.texture) {
          meshMaterial.needsUpdate = true;
        }

        meshMaterial.lightMap = lightMap.texture.texture;

        ((meshMaterial.userData.lightMapTransform as Uniform).value as Matrix3).setUvTransform(
          lightMap.offset[0],
          lightMap.offset[1],
          lightMap.scale[0],
          lightMap.scale[1],
          0,
          0,
          0
        );
      }

      meshMaterial.userData.reflectionProbesMap.value = rendererModule.reflectionProbesMap;

      const reflectionProbeParams = meshMaterial.userData.reflectionProbeParams.value as Vector3;
      reflectionProbeParams.copy(mesh.userData.reflectionProbeParams);

      const reflectionProbeSampleParams = meshMaterial.userData.reflectionProbeSampleParams.value as Vector3;
      const envMapHeight = rendererModule.reflectionProbesMap?.image.height || 256;
      const maxMip = Math.log2(envMapHeight) - 2;
      const texelWidth = 1.0 / (3 * Math.max(Math.pow(2, maxMip), 7 * 16));
      const texelHeight = 1 / envMapHeight;
      reflectionProbeSampleParams.set(maxMip, texelWidth, texelHeight);

      // This is currently added via a patch to Three.js
      (meshMaterial as any).uniformsNeedUpdate = true;
    };

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

      if (meshPrimitiveResource.material) {
        meshPrimitiveResource.material.disposeMeshPrimitiveMaterial(meshPrimitiveResource.materialObj);
      }

      meshPrimitives.splice(i, 1);
    }
  }

  for (let i = 0; i < meshPrimitives.length; i++) {
    const meshPrimitive = meshPrimitives[i];
    const sharedMeshPrimitive = getReadObjectBufferView(meshPrimitive.meshPrimitiveTripleBuffer);
    const nextMaterialResourceId = sharedMeshPrimitive.material[0];

    const nextMaterialResource = getLocalResource<RendererMaterialResource>(ctx, nextMaterialResourceId)?.resource;

    const newMaterialObj = nextMaterialResource
      ? nextMaterialResource.getMaterialForMeshPrimitive(ctx, meshPrimitive.mode, meshPrimitive.attributes)
      : getDefaultMaterialForMeshPrimitive(ctx, meshPrimitive.mode, meshPrimitive.attributes);

    if (newMaterialObj !== meshPrimitive.materialObj) {
      console.log("material changed");
      if (meshPrimitive.materialObj) {
        if (meshPrimitive.material) {
          meshPrimitive.material.disposeMeshPrimitiveMaterial(meshPrimitive.materialObj);
        }
      }

      meshPrimitive.materialObj = newMaterialObj;
    }

    if (
      (meshPrimitive.materialObj as any).aoMap &&
      meshPrimitive.geometryObj.attributes.uv2 === undefined &&
      meshPrimitive.geometryObj.attributes.uv !== undefined
    ) {
      meshPrimitive.geometryObj.setAttribute("uv2", meshPrimitive.geometryObj.attributes.uv);
    }
  }
}

export function updateNodeMesh(
  ctx: RenderThreadState,
  sceneResource: LocalSceneResource,
  node: LocalNode,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>
) {
  const currentMeshResourceId = node.mesh?.resourceId || 0;
  const nextMeshResourceId = nodeReadView.mesh[0];

  if (currentMeshResourceId !== nextMeshResourceId) {
    if (node.meshPrimitiveObjects) {
      for (let i = 0; i < node.meshPrimitiveObjects.length; i++) {
        const primitiveObject = node.meshPrimitiveObjects[i];
        sceneResource.scene.remove(primitiveObject);
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
      createMeshPrimitiveObject(ctx, node, nodeReadView, sceneResource, primitive)
    );
    sceneResource.scene.add(...node.meshPrimitiveObjects);
  }

  if (node.meshPrimitiveObjects) {
    for (let i = 0; i < node.meshPrimitiveObjects.length; i++) {
      const primitiveObject = node.meshPrimitiveObjects[i];

      const nextMaterial = node.mesh.primitives[i].materialObj;

      if (!node.skinnedMesh && primitiveObject.material !== nextMaterial) {
        primitiveObject.material = nextMaterial;
      }

      updateTransformFromNode(ctx, nodeReadView, primitiveObject);

      if (node.skinnedMesh) {
        for (const joint of node.skinnedMesh.joints) {
          if (joint.bone) {
            const boneReadView = getReadObjectBufferView(joint.rendererNodeTripleBuffer);
            updateTransformFromNode(ctx, boneReadView, joint.bone);
          }
        }
      }
    }
  }
}

function updateMorphTargets(mesh: Mesh, gltfMesh: GLTFMesh) {
  mesh.updateMorphTargets();

  if (gltfMesh.weights !== undefined && mesh.morphTargetInfluences) {
    for (let i = 0, il = gltfMesh.weights.length; i < il; i++) {
      mesh.morphTargetInfluences[i] = gltfMesh.weights[i];
    }
  }
}
