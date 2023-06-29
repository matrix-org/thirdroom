import { TilesRenderer } from "3d-tiles-renderer";
import {
  Bone,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  FloatType,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  InstancedMesh,
  Light,
  Line,
  LinearEncoding,
  LinearFilter,
  LineLoop,
  LineSegments,
  Material,
  MathUtils,
  Matrix3,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  Quaternion,
  Scene,
  Skeleton,
  SkinnedMesh,
  SpotLight,
  Texture,
  Uniform,
  Vector3,
} from "three";

import { getModule } from "../../module/module.common";
import { getLocalResources, RenderLightMap, RenderMesh, RenderMeshPrimitive, RenderNode } from "../RenderResources";
import { CameraType, InstancedMeshAttributeIndex, LightType, MeshPrimitiveMode } from "../../resource/schema";
import { updateUICanvas } from "../ui";
import { HologramMaterial } from "../materials/HologramMaterial";
import { MatrixMaterial } from "../materials/MatrixMaterial";
import { MeshPrimitiveAttributeToThreeAttribute, PrimitiveObject3D } from "../mesh";
import { setTransformFromNode, updateTransformFromNode } from "../node";
import { ReflectionProbe } from "../ReflectionProbe";
import { RenderContext, RendererModule } from "../renderer.render";

export function UpdateNodeResourcesSystem(ctx: RenderContext) {
  const { scene, nodeOptimizationsEnabled } = getModule(ctx, RendererModule);
  const nodes = getLocalResources(ctx, RenderNode);

  // Force update if the editor is loaded
  const forceUpdate = !nodeOptimizationsEnabled;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (forceUpdate) {
      node.needsUpdate = true;
    }

    const needsUpdate = node.needsUpdate || !node.isStatic;

    if (!needsUpdate) {
      continue;
    }

    updateNodeCamera(ctx, scene, node);
    updateNodeLight(ctx, scene, node);
    updateNodeReflectionProbe(ctx, scene, node);
    updateNodeMesh(ctx, node);
    updateNodeTilesRenderer(ctx, scene, node);
    updateNodeUICanvas(ctx, scene, node);

    node.needsUpdate = node.isStatic ? false : needsUpdate;
  }
}

function updateNodeCamera(ctx: RenderContext, scene: Scene, node: RenderNode) {
  const currentCameraResourceId = node.currentCameraResourceId;
  const nextCameraResourceId = node.camera?.eid || 0;

  // TODO: Handle node.visible

  if (currentCameraResourceId !== nextCameraResourceId && node.cameraObject) {
    scene.remove(node.cameraObject);
    node.cameraObject = undefined;
  }

  node.currentCameraResourceId = nextCameraResourceId;

  if (!node.camera) {
    return;
  }

  const localCamera = node.camera;

  let camera: PerspectiveCamera | OrthographicCamera | undefined;

  if (localCamera.type === CameraType.Perspective) {
    let perspectiveCamera = node.cameraObject as PerspectiveCamera | undefined;

    if (!perspectiveCamera) {
      perspectiveCamera = new PerspectiveCamera();
      scene.add(perspectiveCamera);
    }

    perspectiveCamera.layers.mask = localCamera.layers;
    perspectiveCamera.fov = localCamera.yfov * MathUtils.RAD2DEG;
    perspectiveCamera.near = localCamera.znear;
    perspectiveCamera.far = localCamera.zfar;

    // Renderer will update aspect based on the viewport if the aspectRatio is set to 0
    if (localCamera.aspectRatio) {
      perspectiveCamera.aspect = localCamera.aspectRatio;
    }

    if (localCamera.projectionMatrixNeedsUpdate) {
      perspectiveCamera.updateProjectionMatrix();
    }

    camera = perspectiveCamera;
  } else if (localCamera.type === CameraType.Orthographic) {
    let orthographicCamera = node.cameraObject as OrthographicCamera | undefined;

    if (!orthographicCamera) {
      orthographicCamera = new OrthographicCamera();
      scene.add(orthographicCamera);
    }

    orthographicCamera.layers.mask = localCamera.layers;
    orthographicCamera.left = -localCamera.xmag;
    orthographicCamera.right = localCamera.xmag;
    orthographicCamera.top = localCamera.ymag;
    orthographicCamera.bottom = -localCamera.ymag;
    orthographicCamera.near = localCamera.znear;
    orthographicCamera.far = localCamera.zfar;

    if (localCamera.projectionMatrixNeedsUpdate) {
      orthographicCamera.updateProjectionMatrix();
    }

    camera = orthographicCamera;
  }

  if (camera) {
    updateTransformFromNode(ctx, node, camera);
  }

  node.cameraObject = camera;
}

function updateNodeLight(ctx: RenderContext, scene: Scene, node: RenderNode) {
  const { renderPipeline } = getModule(ctx, RendererModule);
  const currentLightResourceId = node.currentLightResourceId;
  const nextLightResourceId = node.light?.eid || 0;

  // TODO: Handle node.visible

  if (currentLightResourceId !== nextLightResourceId && node.lightObject) {
    scene.remove(node.lightObject);
    node.lightObject = undefined;
  }

  node.currentLightResourceId = nextLightResourceId;

  if (!node.light) {
    return;
  }

  const lightType = node.light.type;

  let light: Light | undefined;

  const localLight = node.light;

  if (lightType === LightType.Directional) {
    let directionalLight = node.lightObject as DirectionalLight | undefined;

    if (!directionalLight) {
      directionalLight = new DirectionalLight();
      // Ensure light points down negative z axis
      directionalLight.target.position.set(0, 0, -1);
      directionalLight.add(directionalLight.target);

      // TODO: Move to CSM
      directionalLight.shadow.camera.top = 10;
      directionalLight.shadow.camera.bottom = -10;
      directionalLight.shadow.camera.left = -10;
      directionalLight.shadow.camera.right = 10;
      directionalLight.shadow.camera.near = 10;
      directionalLight.shadow.camera.far = 600;
      directionalLight.shadow.bias = 0.0001;
      directionalLight.shadow.normalBias = 0.2;

      if (renderPipeline.directionalShadowMapSize) {
        directionalLight.shadow.mapSize.copy(renderPipeline.directionalShadowMapSize);
      }

      scene.add(directionalLight);
    }

    directionalLight.color.fromArray(localLight.color);
    directionalLight.intensity = localLight.intensity;
    directionalLight.castShadow = node.castShadow;

    light = directionalLight;
  } else if (lightType === LightType.Point) {
    let pointLight = node.lightObject as PointLight | undefined;

    if (!pointLight) {
      pointLight = new PointLight();

      scene.add(pointLight);
    }

    pointLight.color.fromArray(localLight.color);
    pointLight.intensity = localLight.intensity;
    pointLight.castShadow = node.castShadow;
    pointLight.distance = localLight.range;

    if (renderPipeline.shadowMapSize) {
      pointLight.shadow.mapSize.copy(renderPipeline.shadowMapSize);
    }

    light = pointLight;
  } else if (lightType === LightType.Spot) {
    let spotLight = node.lightObject as SpotLight | undefined;

    if (!spotLight) {
      spotLight = new SpotLight();
      spotLight.target.position.set(0, 0, -1);
      spotLight.add(spotLight.target);

      scene.add(spotLight);
    }

    spotLight.color.fromArray(localLight.color);
    spotLight.intensity = localLight.intensity;
    spotLight.castShadow = node.castShadow;
    spotLight.distance = localLight.range;
    spotLight.angle = localLight.outerConeAngle;
    spotLight.penumbra = 1.0 - localLight.innerConeAngle / localLight.outerConeAngle;

    if (renderPipeline.shadowMapSize) {
      spotLight.shadow.mapSize.copy(renderPipeline.shadowMapSize);
    }

    light = spotLight;
  }

  if (light) {
    updateTransformFromNode(ctx, node, light);
  }

  node.lightObject = light;
}

function updateNodeReflectionProbe(ctx: RenderContext, scene: Scene, node: RenderNode) {
  const currentReflectionProbeResourceId = node.currentReflectionProbeResourceId;
  const nextReflectionProbeResourceId = node.reflectionProbe?.eid || 0;

  if (nextReflectionProbeResourceId !== currentReflectionProbeResourceId && node.reflectionProbeObject) {
    scene.remove(node.reflectionProbeObject);
    node.reflectionProbeObject = undefined;
  }

  node.currentReflectionProbeResourceId = nextReflectionProbeResourceId;

  if (!node.reflectionProbe) {
    return;
  }

  if (!node.reflectionProbeObject) {
    const reflectionProbeObject = new ReflectionProbe(node.reflectionProbe);
    node.reflectionProbeObject = reflectionProbeObject;
    scene.add(reflectionProbeObject);
  }

  node.reflectionProbeObject.update(ctx, node);
}

function updateNodeMesh(ctx: RenderContext, node: RenderNode) {
  const rendererModule = getModule(ctx, RendererModule);
  const currentMeshResourceId = node.currentMeshResourceId;
  const nextMeshResourceId = node.mesh?.eid || 0;

  if (currentMeshResourceId !== nextMeshResourceId && node.meshPrimitiveObjects) {
    for (let i = 0; i < node.meshPrimitiveObjects.length; i++) {
      const primitiveObject = node.meshPrimitiveObjects[i];
      rendererModule.scene.remove(primitiveObject);
    }

    node.meshPrimitiveObjects = undefined;
  }

  node.currentMeshResourceId = nextMeshResourceId;

  // Only apply mesh updates if it's loaded and is set to the same resource as is in the triple buffer
  if (!node.mesh) {
    return;
  }

  if (!node.meshPrimitiveObjects) {
    const primitives = node.mesh.primitives;
    const meshPrimitiveObjects = [];

    for (let i = 0; i < primitives.length; i++) {
      const primitive = primitives[i];
      const obj = createMeshPrimitiveObject(ctx, node, node.mesh, primitive);
      meshPrimitiveObjects.push(obj);
      rendererModule.scene.add(obj);
    }

    node.meshPrimitiveObjects = meshPrimitiveObjects;
  }

  if (node.meshPrimitiveObjects) {
    const castShadow = node.castShadow;
    const receiveShadow = node.receiveShadow;

    for (let i = 0; i < node.meshPrimitiveObjects.length; i++) {
      const primitiveObject = node.meshPrimitiveObjects[i];
      const meshPrimitive = node.mesh.primitives[i];

      if (meshPrimitive) {
        const hologramMaterialEnabled = meshPrimitive.hologramMaterialEnabled;

        if (hologramMaterialEnabled && primitiveObject.material !== rendererModule.hologramMaterial) {
          primitiveObject.material = rendererModule.hologramMaterial;
        } else if (!hologramMaterialEnabled && primitiveObject.material === rendererModule.hologramMaterial) {
          primitiveObject.material = meshPrimitive.materialObj;
        } else if (!node.skin && !hologramMaterialEnabled && primitiveObject.material !== meshPrimitive.materialObj) {
          primitiveObject.material = meshPrimitive.materialObj;
        }
      }

      if (meshPrimitive.autoUpdateNormals) {
        // TODO: This causes flickering when used.
        primitiveObject.geometry.computeVertexNormals();
      }

      if (meshPrimitive.drawCount !== 0) {
        meshPrimitive.geometryObj.setDrawRange(meshPrimitive.drawStart, meshPrimitive.drawCount);
      }

      primitiveObject.castShadow = castShadow;
      primitiveObject.receiveShadow = receiveShadow;

      updateTransformFromNode(ctx, node, primitiveObject);

      if (node.skin) {
        const joints = node.skin.joints;

        for (let i = 0; i < joints.length; i++) {
          const joint = joints[i];

          if (joint.bone) {
            updateTransformFromNode(ctx, joint, joint.bone);
          }
        }
      }
    }
  }
}

const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();
const tempMatrix4 = new Matrix4();

function createMeshPrimitiveObject(
  ctx: RenderContext,
  node: RenderNode,
  renderMesh: RenderMesh,
  primitive: RenderMeshPrimitive
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
            let bone = jointNode.bone;

            if (!bone) {
              bone = jointNode.bone = new Bone();
              rendererModule.scene.add(bone);
            }

            bones.push(bone);
            setTransformFromNode(jointNode, bone);

            const inverseMatrix = new Matrix4();

            if (skin.inverseBindMatrices !== undefined) {
              inverseMatrix.fromArray(skin.inverseBindMatrices.attribute.array, j * 16);
            }

            boneInverses.push(inverseMatrix);
          } else {
            throw new Error(`Joint ${skin.joints[j].name} not found`);
          }
        }

        skin.skeleton = new Skeleton(bones, boneInverses);
      }

      const sm = (mesh = new SkinnedMesh(geometryObj, materialObj));

      // TODO: figure out why frustum culling of skinned meshes is affected by the pitch of the camera
      sm.frustumCulled = false;

      setTransformFromNode(node, mesh);

      sm.bind(skin.skeleton, sm.matrixWorld);

      if (!sm.geometry.attributes.skinWeight.normalized) {
        // we normalize floating point skin weight array to fix malformed assets (see #15319)
        // it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
        sm.normalizeSkinWeights();
      }

      if (Object.keys(sm.geometry.morphAttributes).length > 0) {
        updateMorphTargets(sm, renderMesh);
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

    const lightMapTexture = lightMap?.texture?.texture;

    if (lightMapTexture) {
      lightMapTexture.name = "Lightmap";
      lightMapTexture.encoding = LinearEncoding; // Cant't use hardware sRGB conversion when using FloatType
      lightMapTexture.type = FloatType;
      lightMapTexture.minFilter = LinearFilter;
      lightMapTexture.generateMipmaps = false;

      mesh.userData.lightMap = lightMap;
    }

    // Patch material with per-mesh uniforms

    mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
      const meshMaterial = material as MeshStandardMaterial;

      const matrixMaterial = meshMaterial as unknown as MatrixMaterial;

      if (matrixMaterial.isMatrixMaterial) {
        matrixMaterial.update(ctx.elapsed / 1000, mesh);
      }

      const hologramMaterial = meshMaterial as unknown as HologramMaterial;

      if (hologramMaterial.isHologramMaterial) {
        hologramMaterial.update(ctx.elapsed / 1000, renderer);
      }

      if (!meshMaterial.isMeshStandardMaterial) {
        return;
      }

      const lightMap = mesh.userData.lightMap as RenderLightMap | undefined;

      if (lightMap) {
        meshMaterial.lightMapIntensity = lightMap.intensity * Math.PI;

        if (meshMaterial.lightMap === null && lightMap.texture.texture) {
          meshMaterial.needsUpdate = true;
        }

        meshMaterial.lightMap = lightMap.texture.texture || null;

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
    object.userData.reflectionsNeedUpdate = false;
  } else if (mode === MeshPrimitiveMode.LINE_STRIP) {
    object = new Line(geometryObj, materialObj);
    object.userData.reflectionsNeedUpdate = false;
  } else if (mode === MeshPrimitiveMode.LINE_LOOP) {
    object = new LineLoop(geometryObj, materialObj);
    object.userData.reflectionsNeedUpdate = false;
  } else if (mode === MeshPrimitiveMode.POINTS) {
    object = new Points(geometryObj, materialObj);
    object.userData.reflectionsNeedUpdate = false;
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

  object.userData.nodeId = node.eid;

  return object;
}

function updateMorphTargets(mesh: Mesh, renderMesh: RenderMesh) {
  mesh.updateMorphTargets();

  // TODO: support mesh weights
  // if (mesh.morphTargetInfluences) {
  //   for (let i = 0, il = renderMesh.weights.length; i < il; i++) {
  //     mesh.morphTargetInfluences[i] = renderMesh.weights[i];
  //   }
  // }
}

function updateNodeTilesRenderer(ctx: RenderContext, scene: Scene, node: RenderNode) {
  const { tileRendererNodes } = getModule(ctx, RendererModule);

  const currentTilesRendererResourceId = node.currentTilesRendererResourceId;
  const nextTilesRendererResourceId = node.tilesRenderer?.eid || 0;

  if (currentTilesRendererResourceId !== nextTilesRendererResourceId && node.tilesRendererObject) {
    scene.remove(node.tilesRendererObject.group);
    node.tilesRendererObject.dispose();
    node.tilesRendererObject = undefined;
    node.currentTilesRendererResourceId = nextTilesRendererResourceId;

    const index = tileRendererNodes.indexOf(node);

    if (index !== -1) {
      tileRendererNodes.splice(index, 1);
    }
  }

  if (!node.tilesRenderer) {
    return;
  }

  if (!node.tilesRendererObject) {
    node.tilesRendererObject = new TilesRenderer(node.tilesRenderer.uri);
    scene.add(node.tilesRendererObject.group);
    tileRendererNodes.push(node);
  }

  updateTransformFromNode(ctx, node, node.tilesRendererObject.group);
}

function updateNodeUICanvas(ctx: RenderContext, scene: Scene, node: RenderNode) {
  const currentUICanvasResourceId = node.currentUICanvasResourceId;
  const nextUICanvasResourceId = node.uiCanvas?.eid || 0;

  // if uiCanvas changed
  if (currentUICanvasResourceId !== nextUICanvasResourceId && node.uiCanvas) {
    if (node.uiCanvasMesh) {
      scene.remove(node.uiCanvasMesh);
      node.uiCanvasMesh.geometry.dispose();
      (node.uiCanvasMesh.material as MeshBasicMaterial & { map: Texture }).map.dispose();
      (node.uiCanvasMesh.material as Material).dispose();
      node.uiCanvasMesh = undefined;
    }
  }

  node.currentUICanvasResourceId = nextUICanvasResourceId;

  if (!node.uiCanvas || !node.uiCanvas.root) {
    return;
  }

  // create

  const uiCanvas = node.uiCanvas;

  if (!node.uiCanvasMesh || !uiCanvas.canvas) {
    uiCanvas.canvas = new OffscreenCanvas(uiCanvas.width, uiCanvas.height);
    uiCanvas.canvasTexture = new CanvasTexture(uiCanvas.canvas);
    uiCanvas.ctx2d = uiCanvas.canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;

    node.uiCanvasMesh = new Mesh(
      new PlaneGeometry(uiCanvas.size[0], uiCanvas.size[1]),
      new MeshBasicMaterial({ map: uiCanvas.canvasTexture, transparent: true, side: DoubleSide })
    );

    scene.add(node.uiCanvasMesh);
  }

  // update

  if (updateUICanvas(ctx, uiCanvas)) {
    (node.uiCanvasMesh.material as MeshBasicMaterial & { map: Texture }).map.needsUpdate = true;
  }

  // update the canvas mesh transform with the node's
  updateTransformFromNode(ctx, node, node.uiCanvasMesh);
}
