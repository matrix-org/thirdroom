import { Box3, Scene, Vector3, Texture, InstancedMesh, Matrix4, WebGLArrayRenderTarget, Event } from "three";

import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { getModule } from "../module/module.common";
import { RendererNodeTripleBuffer } from "../node/node.common";
import { LocalNode } from "../node/node.render";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource, waitForLocalResource } from "../resource/resource.render";
import { RendererSceneTripleBuffer } from "../scene/scene.common";
import { LocalSceneResource } from "../scene/scene.render";
import { RendererTextureResource } from "../texture/texture.render";
import { SharedReflectionProbeResource } from "./reflection-probe.common";
import { ReflectionProbe } from "./ReflectionProbe";

export interface LocalReflectionProbeResource {
  resourceId: ResourceId;
  reflectionProbeTexture: RendererTextureResource;
  textureArrayIndex: number;
  size?: Vector3;
}

export async function onLoadLocalReflectionProbeResource(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { reflectionProbeTexture, size }: SharedReflectionProbeResource
): Promise<LocalReflectionProbeResource> {
  return {
    resourceId,
    reflectionProbeTexture: await waitForLocalResource<RendererTextureResource>(
      ctx,
      reflectionProbeTexture,
      "Reflection Probe Texture"
    ),
    textureArrayIndex: 0,
    size: size ? new Vector3().fromArray(size as Float32Array) : undefined,
  };
}

export function updateNodeReflectionProbe(
  ctx: RenderThreadState,
  scene: Scene,
  node: LocalNode,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>
) {
  const rendererModule = getModule(ctx, RendererModule);
  const currentReflectionProbeResourceId = node.reflectionProbe?.resourceId || 0;

  if (nodeReadView.reflectionProbe[0] !== currentReflectionProbeResourceId) {
    if (node.reflectionProbeObject) {
      const index = rendererModule.reflectionProbes.indexOf(node.reflectionProbeObject);

      if (index !== -1) {
        rendererModule.reflectionProbes.splice(index, 1);
      }

      scene.remove(node.reflectionProbeObject);
      node.reflectionProbeObject = undefined;
    }

    if (nodeReadView.reflectionProbe[0]) {
      node.reflectionProbe = getLocalResource<LocalReflectionProbeResource>(
        ctx,
        nodeReadView.reflectionProbe[0]
      )?.resource;
    } else {
      node.reflectionProbe = undefined;
    }
  }

  if (!node.reflectionProbe) {
    return;
  }

  if (!node.reflectionProbeObject) {
    const reflectionProbeObject = new ReflectionProbe(node.reflectionProbe);
    reflectionProbeObject.name = getLocalResource(ctx, node.resourceId)?.name || "Reflection Probe";
    node.reflectionProbeObject = reflectionProbeObject;
    scene.add(reflectionProbeObject);
    rendererModule.reflectionProbes.push(reflectionProbeObject);
  }

  node.reflectionProbeObject.update(ctx, nodeReadView);
}

export function updateSceneReflectionProbe(
  ctx: RenderThreadState,
  sceneResource: LocalSceneResource,
  sceneReadView: ReadObjectTripleBufferView<RendererSceneTripleBuffer>
) {
  const currentReflectionProbeResourceId = sceneResource.reflectionProbe?.resourceId || 0;

  if (sceneReadView.reflectionProbe[0] !== currentReflectionProbeResourceId) {
    let nextReflectionProbe: LocalReflectionProbeResource | undefined;

    if (sceneReadView.reflectionProbe[0]) {
      nextReflectionProbe = getLocalResource<LocalReflectionProbeResource>(
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

  let needsUpdate = scene.reflectionProbeNeedsUpdate;

  if (!needsUpdate) {
    for (let i = 0; i < rendererModule.reflectionProbes.length; i++) {
      if (rendererModule.reflectionProbes[i].needsUpdate) {
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
    for (const reflectionProbe of rendererModule.reflectionProbes) {
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

export function updateNodeReflections(
  ctx: RenderThreadState,
  scene: LocalSceneResource | undefined,
  nodes: LocalNode[]
) {
  const rendererModule = getModule(ctx, RendererModule);

  if (!scene) {
    return;
  }

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

      const nodeView = getReadObjectBufferView(node.rendererNodeTripleBuffer);

      if (nodeView.static[0]) {
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

          setReflectionProbeParams(boundingBox, scene, rendererModule.reflectionProbes, instanceReflectionProbeParams);

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
        setReflectionProbeParams(boundingBox, scene, rendererModule.reflectionProbes, reflectionProbeParams);
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
