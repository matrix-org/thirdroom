import { Box3, Scene, Vector3, Texture, InstancedMesh, Matrix4 } from "three";

import { ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { getModule } from "../module/module.common";
import { RendererNodeTripleBuffer } from "../node/node.common";
import { LocalNode } from "../node/node.render";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource, waitForLocalResource } from "../resource/resource.render";
import { RendererSceneTripleBuffer } from "../scene/scene.common";
import { LocalSceneResource } from "../scene/scene.render";
import { LocalTextureResource } from "../texture/texture.render";
import { SharedReflectionProbeResource } from "./reflection-probe.common";
import { ReflectionProbe } from "./ReflectionProbe";

export interface LocalReflectionProbeResource {
  resourceId: ResourceId;
  reflectionProbeTexture: LocalTextureResource;
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
    reflectionProbeTexture: await waitForLocalResource<LocalTextureResource>(
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
    node.reflectionProbeObject = reflectionProbeObject;
    scene.add(reflectionProbeObject);
    rendererModule.reflectionProbes.push(reflectionProbeObject);
  }

  node.reflectionProbeObject.update(ctx, node, nodeReadView);
}

export function updateSceneReflectionProbe(
  ctx: RenderThreadState,
  sceneResource: LocalSceneResource,
  sceneReadView: ReadObjectTripleBufferView<RendererSceneTripleBuffer>
) {
  const currentReflectionProbeResourceId = sceneResource.reflectionProbe?.resourceId || 0;

  if (sceneReadView.reflectionProbe[0] !== currentReflectionProbeResourceId) {
    if (sceneReadView.reflectionProbe[0]) {
      sceneResource.reflectionProbe = getLocalResource<LocalReflectionProbeResource>(
        ctx,
        sceneReadView.reflectionProbe[0]
      )?.resource;
    } else {
      sceneResource.reflectionProbe = undefined;
    }
  }
}

export function updateReflectionProbeTextureArray(ctx: RenderThreadState, scene: LocalSceneResource | undefined) {
  if (!scene) {
    return;
  }

  const rendererModule = getModule(ctx, RendererModule);

  if (!rendererModule.reflectionProbesMap && rendererModule.reflectionProbes.length > 0) {
    const reflectionProbeTextures: Texture[] = [];

    if (scene.reflectionProbe) {
      scene.reflectionProbe.textureArrayIndex = reflectionProbeTextures.length;
      reflectionProbeTextures.push(scene.reflectionProbe.reflectionProbeTexture.texture);
    }

    for (const reflectionProbe of rendererModule.reflectionProbes) {
      reflectionProbe.resource.textureArrayIndex = reflectionProbeTextures.length;
      reflectionProbeTextures.push(reflectionProbe.resource.reflectionProbeTexture.texture);
    }

    const renderTarget = (rendererModule.pmremGenerator as any).fromEquirectangularArray(reflectionProbeTextures);
    rendererModule.reflectionProbesMap = renderTarget.texture;
  }
}

const boundingBox = new Box3();
const boundingBoxSize = new Vector3();
const instanceWorldMatrix = new Matrix4();
const instanceReflectionProbeParams = new Vector3();

export function updateNodeReflections(ctx: RenderThreadState, scene: LocalSceneResource, node: LocalNode) {
  if (!node.meshPrimitiveObjects) {
    return;
  }

  const rendererModule = getModule(ctx, RendererModule);

  for (let i = 0; i < node.meshPrimitiveObjects.length; i++) {
    const primitive = node.meshPrimitiveObjects[i];

    if ("isInstancedMesh" in primitive) {
      const instancedMesh = primitive as InstancedMesh;
      const instanceReflectionProbeParamsAttribute = instancedMesh.geometry.getAttribute(
        "instanceReflectionProbeParams"
      );

      for (let i = 0; i < instancedMesh.count; i++) {
        instancedMesh.getMatrixAt(i, instanceWorldMatrix);
        boundingBox.copy(primitive.geometry.boundingBox!).applyMatrix4(instanceWorldMatrix);
        boundingBox.getSize(boundingBoxSize);
        const boundingBoxVolume = boundingBoxSize.x * boundingBoxSize.y * boundingBoxSize.z;
        setReflectionProbeParams(
          boundingBox,
          boundingBoxVolume,
          scene,
          rendererModule.reflectionProbes,
          instanceReflectionProbeParams
        );
        instanceReflectionProbeParamsAttribute.setXYZ(
          i,
          instanceReflectionProbeParams.x,
          instanceReflectionProbeParams.y,
          instanceReflectionProbeParams.z
        );
      }

      console.log(instanceReflectionProbeParamsAttribute);

      instanceReflectionProbeParamsAttribute.needsUpdate = true;
    } else {
      boundingBox.setFromObject(primitive);
      boundingBox.getSize(boundingBoxSize);
      const boundingBoxVolume = boundingBoxSize.x * boundingBoxSize.y * boundingBoxSize.z;
      const reflectionProbeParams = primitive.userData.reflectionProbeParams as Vector3;
      setReflectionProbeParams(
        boundingBox,
        boundingBoxVolume,
        scene,
        rendererModule.reflectionProbes,
        reflectionProbeParams
      );
    }
  }
}

const tempIntersectionBox = new Box3();
const intersectionSize = new Vector3();

function setReflectionProbeParams(
  boundingBox: Box3,
  boundingBoxVolume: number,
  scene: LocalSceneResource,
  reflectionProbes: ReflectionProbe[],
  reflectionProbeParams: Vector3
) {
  reflectionProbeParams.set(0, 0, 0);

  let foundFirstReflectionProbe = false;
  let foundSecondReflectionProbe = false;

  let intersectionRatio = 0;

  tempIntersectionBox.copy(boundingBox);

  for (let i = 0; i < reflectionProbes.length; i++) {
    const reflectionProbe = reflectionProbes[i];

    if (reflectionProbe.box.intersectsBox(tempIntersectionBox)) {
      if (!foundFirstReflectionProbe) {
        tempIntersectionBox.intersect(reflectionProbe.box);
        tempIntersectionBox.getSize(intersectionSize);
        const intersectionVolume = intersectionSize.x * intersectionSize.y * intersectionSize.z;

        intersectionRatio = intersectionVolume / boundingBoxVolume;

        reflectionProbeParams.x = reflectionProbe.resource.textureArrayIndex;
        reflectionProbeParams.z = 1 - intersectionRatio;

        foundFirstReflectionProbe = true;

        if (intersectionRatio === 1) {
          // We're completely inside the reflection volume so stop searching.
          break;
        }

        // Reset intersection box for second probe
        tempIntersectionBox.copy(boundingBox);
      } else {
        reflectionProbeParams.y = reflectionProbe.resource.textureArrayIndex;
        foundSecondReflectionProbe = true;
        break;
      }
    }
  }

  if (!foundFirstReflectionProbe) {
    if (scene.reflectionProbe !== undefined) {
      reflectionProbeParams.set(scene.reflectionProbe.textureArrayIndex, 0, 0);
    }
  } else if (!foundSecondReflectionProbe && intersectionRatio !== 1) {
    if (scene.reflectionProbe !== undefined) {
      reflectionProbeParams.z = scene.reflectionProbe.textureArrayIndex;
    }
  }
}
