import { Box3, Scene, Vector3, Texture, InstancedMesh, Matrix4, WebGLArrayRenderTarget, Event } from "three";

import { ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { getModule } from "../module/module.common";
import { RendererNodeResource } from "../node/node.render";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { getLocalResource, getLocalResources } from "../resource/resource.render";
import { ReflectionProbeResource } from "../resource/schema";
import { RendererSceneTripleBuffer } from "../scene/scene.common";
import { LocalSceneResource } from "../scene/scene.render";
import { RendererTextureResource } from "../texture/texture.render";
import { ReflectionProbe } from "./ReflectionProbe";

export class RendererReflectionProbeResource extends defineLocalResourceClass<
  typeof ReflectionProbeResource,
  RenderThreadState
>(ReflectionProbeResource) {
  declare reflectionProbeTexture: RendererTextureResource;
  textureArrayIndex = 0;
}

const tempReflectionProbes: ReflectionProbe[] = [];

function getReflectionProbes(ctx: RenderThreadState): ReflectionProbe[] {
  const nodes = getLocalResources(ctx, RendererNodeResource);

  tempReflectionProbes.length = 0;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.reflectionProbeObject) {
      tempReflectionProbes.push(node.reflectionProbeObject);
    }
  }

  return tempReflectionProbes;
}

export function updateNodeReflectionProbe(ctx: RenderThreadState, scene: Scene, node: RendererNodeResource) {
  const currentReflectionProbeResourceId = node.currentReflectionProbeResourceId;
  const nextReflectionProbeResourceId = node.reflectionProbe?.resourceId || 0;

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

export function updateSceneReflectionProbe(
  ctx: RenderThreadState,
  sceneResource: LocalSceneResource,
  sceneReadView: ReadObjectTripleBufferView<RendererSceneTripleBuffer>
) {
  const currentReflectionProbeResourceId = sceneResource.reflectionProbe?.resourceId || 0;

  if (sceneReadView.reflectionProbe[0] !== currentReflectionProbeResourceId) {
    let nextReflectionProbe: RendererReflectionProbeResource | undefined;

    if (sceneReadView.reflectionProbe[0]) {
      nextReflectionProbe = getLocalResource<RendererReflectionProbeResource>(
        ctx,
        sceneReadView.reflectionProbe[0]
      )?.resource;
    } else {
      nextReflectionProbe = undefined;
    }

    if (nextReflectionProbe !== sceneResource.reflectionProbe) {
      sceneResource.reflectionProbeNeedsUpdate = true;
    }

    sceneResource.reflectionProbe = nextReflectionProbe;
  }
}

const reflectionProbeMapRenderTargets = new WeakMap<Texture, WebGLArrayRenderTarget>();

export function updateReflectionProbeTextureArray(ctx: RenderThreadState, scene: LocalSceneResource | undefined) {
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
    const reflectionProbeTextures: Texture[] = [];

    // Add the scene reflection probe to the texture array
    if (scene.reflectionProbe) {
      scene.reflectionProbe.textureArrayIndex = reflectionProbeTextures.length;
      scene.reflectionProbeNeedsUpdate = false;
      reflectionProbeTextures.push(scene.reflectionProbe.reflectionProbeTexture.texture);
    }

    // Add each node reflection probe to the texture array array
    for (const reflectionProbe of reflectionProbes) {
      reflectionProbe.resource.textureArrayIndex = reflectionProbeTextures.length;
      reflectionProbe.needsUpdate = false;
      reflectionProbeTextures.push(reflectionProbe.resource.reflectionProbeTexture.texture);
    }

    if (rendererModule.reflectionProbesMap) {
      // Dispose of the previous WebGLArrayRenderTarget
      rendererModule.reflectionProbesMap.dispose();
    }

    if (reflectionProbeTextures.length > 0) {
      const renderTarget = (rendererModule.pmremGenerator as any).fromEquirectangularArray(reflectionProbeTextures);
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

export function updateNodeReflections(ctx: RenderThreadState, scene: LocalSceneResource | undefined) {
  if (!scene) {
    return;
  }

  const nodes = getLocalResources(ctx, RendererNodeResource);
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

      if (node.isStatic) {
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
  scene: LocalSceneResource,
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
