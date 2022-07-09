import {
  InstancedMesh,
  Light,
  Line,
  LineLoop,
  LineSegments,
  Matrix4,
  Mesh,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Points,
  Quaternion,
  SkinnedMesh,
  Vector3,
} from "three";

import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { LocalCameraResource, updateNodeCamera } from "../camera/camera.render";
import { clamp } from "../component/transform";
import { tickRate } from "../config.common";
import { LocalLightResource, updateNodeLight } from "../light/light.render";
import { LocalInstancedMesh, LocalMesh, updateNodeMesh } from "../mesh/mesh.render";
import { getModule } from "../module/module.common";
import { RendererModule, RendererModuleState, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource } from "../resource/resource.render";
import { waitForLocalResource } from "../resource/resource.render";
import { LocalSceneResource } from "../scene/scene.render";
import { LocalTilesRendererResource, updateNodeTilesRenderer } from "../tiles-renderer/tiles-renderer.render";
import { promiseObject } from "../utils/promiseObject";
import { RendererNodeTripleBuffer, RendererSharedNodeResource } from "./node.common";

type PrimitiveObject3D = Mesh | SkinnedMesh | Line | LineSegments | LineLoop | Points | InstancedMesh;

export interface LocalNode {
  resourceId: ResourceId;
  rendererNodeTripleBuffer: RendererNodeTripleBuffer;
  mesh?: LocalMesh;
  instancedMesh?: LocalInstancedMesh;
  meshPrimitiveObjects?: PrimitiveObject3D[];
  camera?: LocalCameraResource;
  cameraObject?: PerspectiveCamera | OrthographicCamera;
  light?: LocalLightResource;
  lightObject?: Light;
  tilesRenderer?: LocalTilesRendererResource;
}

export async function onLoadLocalNode(
  ctx: RenderThreadState,
  resourceId: ResourceId,
  { rendererNodeTripleBuffer }: RendererSharedNodeResource
): Promise<LocalNode> {
  const rendererModule = getModule(ctx, RendererModule);

  const nodeView = getReadObjectBufferView(rendererNodeTripleBuffer);

  const resources = await promiseObject({
    mesh: nodeView.mesh[0] ? waitForLocalResource<LocalMesh>(ctx, nodeView.mesh[0]) : undefined,
    instancedMesh: nodeView.instancedMesh[0]
      ? waitForLocalResource<LocalInstancedMesh>(ctx, nodeView.instancedMesh[0])
      : undefined,
    camera: nodeView.camera[0] ? waitForLocalResource<LocalCameraResource>(ctx, nodeView.camera[0]) : undefined,
    light: nodeView.light[0] ? waitForLocalResource<LocalLightResource>(ctx, nodeView.light[0]) : undefined,
  });

  const localNode: LocalNode = {
    resourceId,
    rendererNodeTripleBuffer,
    mesh: resources.mesh,
    instancedMesh: resources.instancedMesh,
    camera: resources.camera,
    light: resources.light,
  };

  rendererModule.nodes.push(localNode);

  return localNode;
}

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();

export function updateTransformFromNode(
  ctx: RenderThreadState,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>,
  object3D: Object3D
) {
  const frameRate = 1 / ctx.dt;
  const lerpAlpha = clamp(tickRate / frameRate, 0, 1);

  tempMatrix4.fromArray(nodeReadView.worldMatrix);
  tempMatrix4.decompose(tempPosition, tempQuaternion, tempScale);

  // TODO: Optimize static objects
  object3D.position.lerp(tempPosition, lerpAlpha);
  object3D.quaternion.slerp(tempQuaternion, lerpAlpha);
  object3D.scale.lerp(tempScale, lerpAlpha);

  object3D.visible = !!nodeReadView.visible[0];
}

export function updateLocalNodeResources(
  ctx: RenderThreadState,
  rendererModule: RendererModuleState,
  nodes: LocalNode[],
  activeSceneResource: LocalSceneResource | undefined,
  activeCameraNode: LocalNode | undefined
) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const nodeResource = getLocalResource<LocalNode>(ctx, node.resourceId);

    if (nodeResource && nodeResource.statusView[1]) {
      if (node.camera) {
        if (activeSceneResource && node.cameraObject) {
          activeSceneResource.scene.remove(node.cameraObject);
        }

        node.cameraObject = undefined;
        node.camera = undefined;
      }

      if (node.mesh) {
        if (activeSceneResource && node.meshPrimitiveObjects) {
          activeSceneResource.scene.remove(...node.meshPrimitiveObjects);
        }

        const primitives = node.mesh.primitives;

        for (let j = 0; j < primitives.length; j++) {
          const primitive = primitives[j];

          const index = rendererModule.meshPrimitives.indexOf(primitive);

          if (index !== -1) {
            rendererModule.meshPrimitives.splice(index, 1);
          }
        }

        node.meshPrimitiveObjects = undefined;
        node.mesh = undefined;
      }

      if (node.light) {
        if (activeSceneResource && node.lightObject) {
          activeSceneResource.scene.remove(node.lightObject);
        }

        node.lightObject = undefined;
        node.light = undefined;
      }

      if (node.tilesRenderer) {
        if (activeSceneResource) {
          activeSceneResource.scene.remove(node.tilesRenderer.tilesRenderer.group);
        }

        node.tilesRenderer.tilesRenderer.dispose();
        node.tilesRenderer = undefined;
      }

      nodes.splice(i, 1);
    }
  }

  if (!activeSceneResource) {
    return;
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeView = getReadObjectBufferView(node.rendererNodeTripleBuffer);
    updateNodeCamera(ctx, activeSceneResource.scene, node, nodeView);
    updateNodeLight(ctx, activeSceneResource.scene, node, nodeView);
    updateNodeMesh(ctx, activeSceneResource.scene, node, nodeView);
    updateNodeTilesRenderer(ctx, activeSceneResource.scene, activeCameraNode, node, nodeView);
  }
}
