import { vec2 } from "gl-matrix";
import {
  Mesh,
  BufferGeometry,
  Material,
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
  MeshBasicMaterial,
  MeshStandardMaterial,
  Matrix3,
  Uniform,
  FloatType,
  LinearFilter,
  LinearEncoding,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Vector2,
} from "three";

import { LocalAccessor } from "../accessor/accessor.render";
import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
// import { Skeleton, SkinnedMesh } from "../animation/Skeleton";
import { GLTFMesh } from "../gltf/GLTF";
import { MAX_SHADOW_DISTANCE, NUM_CSM_CASCADES } from "../light/CSMDirectionalLight";
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
import { LocalNode, setTransformFromNode, updateTransformFromNode } from "../node/node.render";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource, getResourceDisposed, waitForLocalResource } from "../resource/resource.render";
import { LocalSceneResource } from "../scene/scene.render";
import { LocalTextureResource } from "../texture/texture.render";
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
  texture: LocalTextureResource;
  offset: vec2;
  scale: vec2;
  intensity: number;
}

export async function onLoadLocalLightMapResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  props: SharedLightMapResource
): Promise<LocalLightMap> {
  const lightMapResource = await waitForLocalResource<LocalTextureResource>(ctx, props.texture, "light-map");

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

    const material = materialObj as MeshBasicMaterial | MeshStandardMaterial;

    if (!material.defines) {
      material.defines = {};
    }

    if (!("isMeshBasicMaterial" in material)) {
      material.defines.USE_CSM = "";
      material.defines.CSM_CASCADES = NUM_CSM_CASCADES;
      material.defines.USE_ENVMAP = "";
      material.defines.ENVMAP_MODE_REFLECTION = "";
      material.defines.ENVMAP_TYPE_CUBE_UV = "";
      material.defines.CUBEUV_2D_SAMPLER_ARRAY = "";
      material.defines.ENVMAP_BLENDING_NONE = "";
      material.defines.USE_REFLECTION_PROBES = "";
    }

    if (!material.userData.beforeCompileHook) {
      const csmSplits = new Uniform(Array.from({ length: NUM_CSM_CASCADES }, () => new Vector2()));
      const cameraNear = new Uniform(1);
      const shadowFar = new Uniform(MAX_SHADOW_DISTANCE);
      const lightMapTransform = new Uniform(new Matrix3().setUvTransform(0, 0, 1, 1, 0, 0, 0));
      const reflectionProbesMap = new Uniform(rendererModule.reflectionProbesMap);
      const reflectionProbeParams = new Uniform(new Vector3());
      const reflectionProbeSampleParams = new Uniform(new Vector3());

      material.onBeforeCompile = (shader) => {
        shader.uniforms.CSM_cascades = csmSplits;
        shader.uniforms.cameraNear = cameraNear;
        shader.uniforms.shadowFar = shadowFar;
        shader.uniforms.lightMapTransform = lightMapTransform;
        shader.uniforms.reflectionProbesMap = reflectionProbesMap;
        shader.uniforms.reflectionProbeParams = reflectionProbeParams;
        shader.uniforms.reflectionProbeSampleParams = reflectionProbeSampleParams;
      };

      material.userData.beforeCompileHook = true;
      material.userData.csmSplits = csmSplits;
      material.userData.cameraNear = cameraNear;
      material.userData.shadowFar = shadowFar;
      material.userData.lightMapTransform = lightMapTransform;
      material.userData.reflectionProbesMap = reflectionProbesMap;
      material.userData.reflectionProbeParams = reflectionProbeParams;
      material.userData.reflectionProbeSampleParams = reflectionProbeSampleParams;

      material.needsUpdate = true;
    }

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
      updateMeshPrimitiveStandardMaterial(
        meshPrimitive,
        meshPrimitive.materialObj as PrimitiveStandardMaterial,
        nextMaterialResource
      );
    } else if (nextMaterialResource && nextMaterialResource.type === MaterialType.Unlit) {
      updateMeshPrimitiveUnlitMaterial(meshPrimitive.materialObj as PrimitiveUnlitMaterial, nextMaterialResource);
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
