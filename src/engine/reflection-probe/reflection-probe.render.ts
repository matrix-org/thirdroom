import { Matrix4, Scene, Vector3 } from "three";

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

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();

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
      const nextReflectionProbe = getLocalResource<LocalReflectionProbeResource>(
        ctx,
        sceneReadView.reflectionProbe[0]
      )?.resource;

      sceneResource.reflectionProbe = nextReflectionProbe;
    } else {
      sceneResource.reflectionProbe = undefined;
    }
  }
}

export function updateNodeReflections(
  ctx: RenderThreadState,
  node: LocalNode,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>
) {
  if (!node.meshPrimitiveObjects) {
    return;
  }

  tempMatrix4.fromArray(nodeReadView.worldMatrix);
  tempPosition.setFromMatrixPosition(tempMatrix4);

  const rendererModule = getModule(ctx, RendererModule);

  for (let i = 0; i < rendererModule.nodes.length; i++) {
    const reflectionProbeNode = rendererModule.nodes[i];

    if (reflectionProbeNode.reflectionProbeObject) {
      if (reflectionProbeNode.reflectionProbeObject.box.containsPoint(tempPosition)) {
        //console.log(node);
      }
    }
  }
}
