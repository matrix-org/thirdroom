import { Box3, Scene, Vector3, Texture, InstancedMesh, Matrix4, WebGLArrayRenderTarget, Event, Vector2 } from "three";

import { getModule } from "../module/module.common";
import { RendererModule, RendererModuleState, RenderThreadState } from "../renderer/renderer.render";
import { LoadStatus } from "../resource/resource.common";
import { getLocalResources, RenderNode, RenderScene } from "../resource/resource.render";
import { ReflectionProbe } from "./ReflectionProbe";

const tempReflectionProbes: ReflectionProbe[] = [];

function getReflectionProbes(ctx: RenderThreadState): ReflectionProbe[] {
  const nodes = getLocalResources(ctx, RenderNode);

  tempReflectionProbes.length = 0;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.reflectionProbeObject) {
      tempReflectionProbes.push(node.reflectionProbeObject);
    }
  }

  return tempReflectionProbes;
}

export function updateNodeReflectionProbe(ctx: RenderThreadState, scene: Scene, node: RenderNode) {
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

export function updateSceneReflectionProbe(ctx: RenderThreadState, scene: RenderScene) {
  const currentReflectionProbeResourceId = scene.currentReflectionProbeResourceId;
  const nextReflectionProbeResourceId = scene.reflectionProbe?.eid || 0;

  if (nextReflectionProbeResourceId !== currentReflectionProbeResourceId) {
    scene.reflectionProbeNeedsUpdate = true;
  }

  scene.currentReflectionProbeResourceId = nextReflectionProbeResourceId;
}

const reflectionProbeMapRenderTargets = new WeakMap<Texture, WebGLArrayRenderTarget>();

export function updateReflectionProbeTextureArray(ctx: RenderThreadState, scene: RenderScene | undefined) {
  if (!scene) {
    return;
  }

  const rendererModule = getModule(ctx, RendererModule);

  const reflectionProbes = getReflectionProbes(ctx);

  let needsUpdate = scene.reflectionProbeNeedsUpdate;

  if (!needsUpdate) {
    for (let i = 0; i < reflectionProbes.length; i++) {
      if (reflectionProbes[i].needsUpdate) {
        needsUpdate = true;
        break;
      }
    }
  }

  // Only update reflection probe texture array if the reflection probes changed
  if (needsUpdate) {
    let useRGBM = false;
    const reflectionProbeTextures: Texture[] = [];

    // Add the scene reflection probe to the texture array
    if (
      scene.reflectionProbe?.reflectionProbeTexture?.loadStatus === LoadStatus.Loaded &&
      scene.reflectionProbe.reflectionProbeTexture.texture
    ) {
      if (scene.reflectionProbe.reflectionProbeTexture.rgbm) {
        useRGBM = true;
      }

      scene.reflectionProbe.textureArrayIndex = reflectionProbeTextures.length;
      scene.reflectionProbeNeedsUpdate = false;
      reflectionProbeTextures.push(scene.reflectionProbe.reflectionProbeTexture.texture);
    }

    // Add each node reflection probe to the texture array array
    for (const reflectionProbe of reflectionProbes) {
      const reflectionProbeTexture = reflectionProbe.resource.reflectionProbeTexture;

      if (!reflectionProbeTexture) {
        throw new Error("Reflection probe texture not yet loaded");
      }

      if (reflectionProbeTexture.loadStatus === LoadStatus.Loaded && reflectionProbeTexture.texture) {
        reflectionProbe.resource.textureArrayIndex = reflectionProbeTextures.length;
        reflectionProbe.needsUpdate = false;
        reflectionProbeTextures.push(reflectionProbeTexture.texture);

        if (reflectionProbeTexture.rgbm) {
          useRGBM = true;
        }
      }
    }

    if (rendererModule.reflectionProbesMap) {
      // Dispose of the previous WebGLArrayRenderTarget
      rendererModule.reflectionProbesMap.dispose();
    }

    if (reflectionProbeTextures.length > 0) {
      const hdrDecodeParams = useRGBM ? new Vector2(34.49, 2.2) : null;

      const renderTarget = (rendererModule.pmremGenerator as any).fromEquirectangularArray(
        reflectionProbeTextures,
        hdrDecodeParams
      );
      reflectionProbeMapRenderTargets.set(renderTarget.texture, renderTarget);
      rendererModule.reflectionProbesMap = renderTarget.texture;

      const onReflectionProbeTextureDisposed = (event: Event) => {
        const texture = event.target as Texture;

        const renderTarget = reflectionProbeMapRenderTargets.get(texture);

        if (renderTarget) {
          reflectionProbeMapRenderTargets.delete(texture);
          // Ensure render target is disposed when the texture is disposed.
          renderTarget.dispose();
        }

        texture.removeEventListener("dispose", onReflectionProbeTextureDisposed);
      };

      renderTarget.texture.addEventListener("dispose", onReflectionProbeTextureDisposed);
      rendererModule.pmremGenerator.dispose(); // Dispose of the extra render target and materials
    } else {
      rendererModule.reflectionProbesMap = null;
    }
  }
}

const boundingBox = new Box3();
const boundingBoxSize = new Vector3();
const instanceWorldMatrix = new Matrix4();
const instanceReflectionProbeParams = new Vector3();

export function updateNodeReflections(
  ctx: RenderThreadState,
  scene: RenderScene | undefined,
  rendererModule: RendererModuleState
) {
  if (!scene) {
    return;
  }

  const nodes = getLocalResources(ctx, RenderNode);
  const reflectionProbes = getReflectionProbes(ctx);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (!node.meshPrimitiveObjects) {
      continue;
    }

    for (let i = 0; i < node.meshPrimitiveObjects.length; i++) {
      const primitive = node.meshPrimitiveObjects[i];

      if (primitive.userData.reflectionsNeedUpdate === false) {
        continue;
      }

      if (node.isStatic && !node.needsUpdate) {
        primitive.userData.reflectionsNeedUpdate = false;
      }

      if ("isInstancedMesh" in primitive) {
        const instancedMesh = primitive as InstancedMesh;
        const instanceReflectionProbeParamsAttribute = instancedMesh.geometry.getAttribute(
          "instanceReflectionProbeParams"
        );

        for (let i = 0; i < instancedMesh.count; i++) {
          instancedMesh.getMatrixAt(i, instanceWorldMatrix);
          instanceWorldMatrix.premultiply(instancedMesh.matrixWorld);

          if (!primitive.geometry.boundingBox) {
            primitive.geometry.computeBoundingBox();
          }

          // computeBoundingBox will set geometry.boundingBox
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          boundingBox.copy(primitive.geometry.boundingBox!);
          boundingBox.expandByScalar(0.01);

          // Apply the instance's transform to the bounding box
          boundingBox.applyMatrix4(instanceWorldMatrix);

          setReflectionProbeParams(boundingBox, scene, reflectionProbes, instanceReflectionProbeParams);

          // Set the instance's reflectionProbeParams
          instanceReflectionProbeParamsAttribute.setXYZ(
            i,
            instanceReflectionProbeParams.x,
            instanceReflectionProbeParams.y,
            instanceReflectionProbeParams.z
          );
        }

        // Reupload reflection probe params buffer
        instanceReflectionProbeParamsAttribute.needsUpdate = true;
      } else {
        boundingBox.setFromObject(primitive);
        boundingBox.expandByScalar(0.01);
        const reflectionProbeParams = primitive.userData.reflectionProbeParams as Vector3;
        setReflectionProbeParams(boundingBox, scene, reflectionProbes, reflectionProbeParams);
      }
    }
  }
}

const tempIntersectionBox = new Box3();
const intersectionSize = new Vector3();

function setReflectionProbeParams(
  primitiveBoundingBox: Box3,
  scene: RenderScene,
  reflectionProbes: ReflectionProbe[],
  reflectionProbeParams: Vector3
) {
  reflectionProbeParams.set(0, 0, 0);

  const intersections = [];

  // Accumulate all intersecting reflection probe volumes
  for (let i = 0; i < reflectionProbes.length; i++) {
    const reflectionProbe = reflectionProbes[i];

    if (primitiveBoundingBox.intersectsBox(reflectionProbe.box)) {
      tempIntersectionBox.copy(primitiveBoundingBox);
      tempIntersectionBox.intersect(reflectionProbe.box);
      tempIntersectionBox.getSize(intersectionSize);
      const intersectionVolume = intersectionSize.x * intersectionSize.y * intersectionSize.z;
      intersections.push({ textureArrayIndex: reflectionProbe.resource.textureArrayIndex, intersectionVolume });
    }
  }

  // Sort intersections in descending order (largest intersection volume first)
  intersections.sort((a, b) => b.intersectionVolume - a.intersectionVolume);

  primitiveBoundingBox.getSize(boundingBoxSize);
  const boundingBoxVolume = boundingBoxSize.x * boundingBoxSize.y * boundingBoxSize.z;

  // Set the primitive's reflection probe parameters
  // x: first probe's texture array index
  // y: second probe's texture array index
  // z: mix factor between first and second probes (0 = 100% first probe, 1 = 100% second probe)
  reflectionProbeParams.set(
    (intersections.length > 0 ? intersections[0].textureArrayIndex : scene.reflectionProbe?.textureArrayIndex) || 0,
    (intersections.length > 1 ? intersections[1].textureArrayIndex : scene.reflectionProbe?.textureArrayIndex) || 0,
    intersections.length === 0
      ? 0
      : intersections.length === 1
      ? 1 - intersections[0].intersectionVolume / boundingBoxVolume
      : 1 -
          intersections[0].intersectionVolume /
            (intersections[0].intersectionVolume + intersections[1].intersectionVolume) || 0
  );
}
