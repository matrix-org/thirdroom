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

import { RendererAccessorResource } from "../accessor/accessor.render";
import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { GLTFMesh } from "../gltf/GLTF";
import {
  getDefaultMaterialForMeshPrimitive,
  PrimitiveMaterial,
  RendererMaterialResource,
} from "../material/material.render";
import { MatrixMaterial } from "../material/MatrixMaterial";
import { getModule } from "../module/module.common";
import { RendererNodeTripleBuffer } from "../node/node.common";
import { LocalNode, setTransformFromNode, updateTransformFromNode } from "../node/node.render";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { getLocalResource, getLocalResources } from "../resource/resource.render";
import {
  InstancedMeshAttributeIndex,
  MeshPrimitiveAttributeIndex,
  MeshPrimitiveMode,
  MeshPrimitiveResource,
  MeshResource,
  InstancedMeshResource,
  SkinResource,
  LightMapResource,
} from "../resource/schema";
import { LocalSceneResource } from "../scene/scene.render";
import { RendererTextureResource } from "../texture/texture.render";
import { toTrianglesDrawMode } from "../utils/toTrianglesDrawMode";

export type PrimitiveObject3D = SkinnedMesh | Mesh | Line | LineSegments | LineLoop | Points;

const defaultGeometry = new BufferGeometry();
const defaultMaterial = new MeshStandardMaterial();

const MeshPrimitiveAttributeToThreeAttribute: { [key: number]: string } = {
  [MeshPrimitiveAttributeIndex.POSITION]: "position",
  [MeshPrimitiveAttributeIndex.NORMAL]: "normal",
  [MeshPrimitiveAttributeIndex.TANGENT]: "tangent",
  [MeshPrimitiveAttributeIndex.TEXCOORD_0]: "uv",
  [MeshPrimitiveAttributeIndex.TEXCOORD_1]: "uv2",
  [MeshPrimitiveAttributeIndex.COLOR_0]: "color",
  [MeshPrimitiveAttributeIndex.JOINTS_0]: "skinIndex",
  [MeshPrimitiveAttributeIndex.WEIGHTS_0]: "skinWeight",
};

export class RendererMeshPrimitiveResource extends defineLocalResourceClass<
  typeof MeshPrimitiveResource,
  RenderThreadState
>(MeshPrimitiveResource) {
  geometryObj: BufferGeometry = defaultGeometry;
  materialObj: PrimitiveMaterial = defaultMaterial;

  declare indices: RendererAccessorResource | undefined;
  declare attributes: readonly RendererAccessorResource[];
  declare material: RendererMaterialResource | undefined;

  async load(ctx: RenderThreadState) {
    let geometryObj = new BufferGeometry();

    if (this.indices) {
      if ("isInterleavedBufferAttribute" in this.indices.attribute) {
        throw new Error("Interleaved attributes are not supported as mesh indices.");
      }

      geometryObj.setIndex(this.indices.attribute);
    }

    for (let i = 0; i < this.attributes.length; i++) {
      const accessor = this.attributes[i];

      if (accessor) {
        geometryObj.setAttribute(MeshPrimitiveAttributeToThreeAttribute[i], accessor.attribute);
      }
    }

    if (this.mode === MeshPrimitiveMode.TRIANGLE_STRIP) {
      geometryObj = toTrianglesDrawMode(geometryObj, MeshPrimitiveMode.TRIANGLE_STRIP);
    } else if (this.mode === MeshPrimitiveMode.TRIANGLE_FAN) {
      geometryObj = toTrianglesDrawMode(geometryObj, MeshPrimitiveMode.TRIANGLE_FAN);
    }

    this.geometryObj = geometryObj;

    if (!this.material) {
      this.materialObj = getDefaultMaterialForMeshPrimitive(ctx, this);
    } else {
      this.materialObj = this.material.getMaterialForMeshPrimitive(ctx, this);
    }
  }

  dispose() {
    this.geometryObj.dispose();

    if (this.material) {
      this.material.disposeMeshPrimitiveMaterial(this.materialObj);
    }
  }
}

export class RendererMeshResource extends defineLocalResourceClass<typeof MeshResource, RenderThreadState>(
  MeshResource
) {
  declare primitives: readonly RendererMeshPrimitiveResource[];
}

export class RendererInstancedMeshResource extends defineLocalResourceClass<
  typeof InstancedMeshResource,
  RenderThreadState
>(InstancedMeshResource) {
  declare attributes: readonly RendererAccessorResource[];
}

export class RendererSkinResource extends defineLocalResourceClass<typeof SkinResource, RenderThreadState>(
  SkinResource
) {
  declare joints: LocalNode[];
  declare inverseBindMatrices: RendererAccessorResource;
  skeleton?: Skeleton;
}

export class RendererLightMapResource extends defineLocalResourceClass<typeof LightMapResource, RenderThreadState>(
  LightMapResource
) {
  declare texture: RendererTextureResource;
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
  primitive: RendererMeshPrimitiveResource
): PrimitiveObject3D {
  const rendererModule = getModule(ctx, RendererModule);

  let object: PrimitiveObject3D;

  const { instancedMesh, skin, lightMap } = node;
  const { mode, geometryObj, materialObj } = primitive;

  if (
    mode === MeshPrimitiveMode.TRIANGLES ||
    mode === MeshPrimitiveMode.TRIANGLE_FAN ||
    mode === MeshPrimitiveMode.TRIANGLE_STRIP
  ) {
    let mesh: Mesh | InstancedMesh;

    if (skin) {
      if (!skin.skeleton) {
        const bones = [];
        const boneInverses = [];

        // TODO: remove this and use boneMatrices instead
        for (let j = 0, jl = skin.joints.length; j < jl; j++) {
          const jointNode = skin.joints[j];

          if (jointNode) {
            const boneReadView = getReadObjectBufferView(jointNode.rendererNodeTripleBuffer);

            const bone = (jointNode.bone = new Bone());
            bones.push(bone);
            sceneResource.scene.add(bone);
            setTransformFromNode(ctx, boneReadView, bone);

            const inverseMatrix = new Matrix4();

            if (skin.inverseBindMatrices !== undefined) {
              inverseMatrix.fromArray(skin.inverseBindMatrices.attribute.array, j * 16);
            }

            boneInverses.push(inverseMatrix);
          } else {
            throw new Error(`Joint ${skin.joints[j]} not found`);
          }
        }

        skin.skeleton = new Skeleton(bones, boneInverses);
      }

      const sm = (mesh = new SkinnedMesh(geometryObj, materialObj));

      // TODO: figure out why frustum culling of skinned meshes is affected by the pitch of the camera
      sm.frustumCulled = false;

      setTransformFromNode(ctx, nodeReadView, mesh);

      sm.bind(skin.skeleton, sm.matrixWorld);

      if (!sm.geometry.attributes.skinWeight.normalized) {
        // we normalize floating point skin weight array to fix malformed assets (see #15319)
        // it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
        sm.normalizeSkinWeights();
      }

      if (Object.keys(sm.geometry.morphAttributes).length > 0) {
        updateMorphTargets(sm, primitive as unknown as GLTFMesh);
      }
    } else if (instancedMesh) {
      let count = 0;

      for (let i = 0; i < instancedMesh.attributes.length; i++) {
        const accessor = instancedMesh.attributes[i];

        if (accessor) {
          count = accessor.count;
          break;
        }
      }

      const instancedGeometry = new InstancedBufferGeometry();
      instancedGeometry.instanceCount = count;

      instancedGeometry.setIndex(geometryObj.getIndex());

      for (const semanticName in MeshPrimitiveAttributeToThreeAttribute) {
        const attributeName = MeshPrimitiveAttributeToThreeAttribute[semanticName];

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
        if (instancedMesh.attributes[InstancedMeshAttributeIndex.TRANSLATION]) {
          tempPosition.fromBufferAttribute(
            instancedMesh.attributes[InstancedMeshAttributeIndex.TRANSLATION].attribute,
            instanceIndex
          );
        }

        if (instancedMesh.attributes[InstancedMeshAttributeIndex.ROTATION]) {
          // TODO: Add fromBufferAttribute to Quaternion types
          (tempQuaternion as any).fromBufferAttribute(
            instancedMesh.attributes[InstancedMeshAttributeIndex.ROTATION].attribute,
            instanceIndex
          );
        }

        if (instancedMesh.attributes[InstancedMeshAttributeIndex.SCALE]) {
          tempScale.fromBufferAttribute(
            instancedMesh.attributes[InstancedMeshAttributeIndex.SCALE].attribute,
            instanceIndex
          );
        }

        instancedMeshObject.setMatrixAt(instanceIndex, tempMatrix4.compose(tempPosition, tempQuaternion, tempScale));
      }

      if (instancedMesh.attributes[InstancedMeshAttributeIndex.LIGHTMAP_OFFSET]) {
        const lightMapOffset = instancedMesh.attributes[InstancedMeshAttributeIndex.LIGHTMAP_OFFSET].attribute;

        instancedGeometry.setAttribute(
          "lightMapOffset",
          new InstancedBufferAttribute(lightMapOffset.array, lightMapOffset.itemSize, lightMapOffset.normalized, 1)
        );
      }

      if (instancedMesh.attributes[InstancedMeshAttributeIndex.LIGHTMAP_SCALE]) {
        const lightMapScale = instancedMesh.attributes[InstancedMeshAttributeIndex.LIGHTMAP_SCALE].attribute;

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

      const matrixMaterial = meshMaterial as unknown as MatrixMaterial;

      if (matrixMaterial.isMatrixMaterial) {
        matrixMaterial.update(ctx.elapsed / 1000, mesh);
      }

      if (!meshMaterial.isMeshStandardMaterial) {
        return;
      }

      const lightMap = mesh.userData.lightMap as RendererLightMapResource | undefined;

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

export function UpdateRendererMeshPrimitivesSystem(ctx: RenderThreadState) {
  const meshPrimitives = getLocalResources(ctx, RendererMeshPrimitiveResource);

  for (let i = 0; i < meshPrimitives.length; i++) {
    const meshPrimitive = meshPrimitives[i];
    const nextMaterialResourceId = meshPrimitive.material?.resourceId || 0;
    const nextMaterialResource = getLocalResource<RendererMaterialResource>(ctx, nextMaterialResourceId)?.resource;

    const newMaterialObj = nextMaterialResource
      ? nextMaterialResource.getMaterialForMeshPrimitive(ctx, meshPrimitive)
      : getDefaultMaterialForMeshPrimitive(ctx, meshPrimitive);

    if (newMaterialObj !== meshPrimitive.materialObj) {
      if (meshPrimitive.material) {
        meshPrimitive.material.disposeMeshPrimitiveMaterial(meshPrimitive.materialObj);
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
      node.mesh = getLocalResource<RendererMeshResource>(ctx, nextMeshResourceId)?.resource;
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
      const meshPrimitive = node.mesh.primitives[i];

      if (meshPrimitive && !node.skin && primitiveObject.material !== meshPrimitive.materialObj) {
        primitiveObject.material = meshPrimitive.materialObj;
      }

      updateTransformFromNode(ctx, nodeReadView, primitiveObject);

      if (node.skin) {
        for (const joint of node.skin.joints) {
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
