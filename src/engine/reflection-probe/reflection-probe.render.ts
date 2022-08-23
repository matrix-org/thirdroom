import { Box3, Scene, Vector3 } from "three";

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
    size: size ? new Vector3().fromArray(size as Float32Array) : undefined,
  };
}

export function updateNodeReflectionProbe(
  ctx: RenderThreadState,
  scene: Scene,
  node: LocalNode,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>
) {
  const currentReflectionProbeResourceId = node.reflectionProbe?.resourceId || 0;

  if (nodeReadView.reflectionProbe[0] !== currentReflectionProbeResourceId) {
    if (node.reflectionProbeObject) {
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
    node.reflectionProbeObject = new ReflectionProbe();
    scene.add(node.reflectionProbeObject);
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

const intersectionBox = new Box3();
const boundingBoxSize = new Vector3();
const intersectionSize = new Vector3();

export function updateNodeReflections(ctx: RenderThreadState, scene: LocalSceneResource, node: LocalNode) {
  if (!node.meshPrimitiveObjects) {
    return;
  }

  const rendererModule = getModule(ctx, RendererModule);

  for (let i = 0; i < node.meshPrimitiveObjects.length; i++) {
    let foundFirstReflectionProbe = false;
    let foundSecondReflectionProbe = false;

    const primitive = node.meshPrimitiveObjects[i];
    intersectionBox.setFromObject(primitive);
    intersectionBox.getSize(boundingBoxSize);

    const boundingBoxVolume = boundingBoxSize.x * boundingBoxSize.y * boundingBoxSize.z;

    let intersectionRatio = 0;

    primitive.userData.envMapMix = 0;

    for (let i = 0; i < rendererModule.nodes.length; i++) {
      const reflectionProbeNode = rendererModule.nodes[i];

      if (reflectionProbeNode.reflectionProbeObject) {
        if (reflectionProbeNode.reflectionProbeObject.box.intersectsBox(intersectionBox)) {
          if (!foundFirstReflectionProbe) {
            intersectionBox.intersect(reflectionProbeNode.reflectionProbeObject.box);
            intersectionBox.getSize(intersectionSize);
            const intersectionVolume = intersectionSize.x * intersectionSize.y * intersectionSize.z;
            intersectionRatio = intersectionVolume / boundingBoxVolume;

            primitive.userData.envMap = reflectionProbeNode.reflectionProbe?.reflectionProbeTexture.texture || null;
            primitive.userData.envMapMix = 1 - intersectionRatio;

            foundFirstReflectionProbe = true;

            if (intersectionRatio === 1) {
              // We're completely inside the reflection volume so stop searching.
              break;
            }

            // Reset intersection box for second probe
            intersectionBox.setFromObject(primitive);
          } else {
            primitive.userData.envMap2 = reflectionProbeNode.reflectionProbe?.reflectionProbeTexture.texture || null;
            foundSecondReflectionProbe = true;
            break;
          }
        }
      }
    }

    if (!foundFirstReflectionProbe) {
      if (scene.reflectionProbe) {
        primitive.userData.envMap = scene.reflectionProbe.reflectionProbeTexture.texture || null;
      }
    } else if (!foundSecondReflectionProbe && intersectionRatio !== 1) {
      if (scene.reflectionProbe) {
        primitive.userData.envMap2 = scene.reflectionProbe.reflectionProbeTexture.texture || null;
      }
    }
  }
}
