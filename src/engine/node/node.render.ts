import {
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
import { CameraType } from "../camera/camera.common";
import { LocalCameraResource, updateNodeCamera } from "../camera/camera.render";
import { clamp } from "../component/transform";
import { tickRate } from "../config.common";
import { LocalLightResource, updateNodeLight } from "../light/light.render";
import { LocalMesh, updateNodeMesh } from "../mesh/mesh.render";
import { getModule } from "../module/module.common";
import { RendererModule, RendererModuleState, RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { getLocalResource } from "../resource/resource.render";
import { waitForLocalResource } from "../resource/resource.render";
import { LocalSceneResource } from "../scene/scene.render";
import { promiseObject } from "../utils/promiseObject";
import { RendererNodeTripleBuffer, RendererSharedNodeResource } from "./node.common";

type PrimitiveObject3D = Mesh | SkinnedMesh | Line | LineSegments | LineLoop | Points;

export interface LocalNode {
  resourceId: ResourceId;
  rendererNodeTripleBuffer: RendererNodeTripleBuffer;
  mesh?: LocalMesh;
  meshPrimitiveObjects?: PrimitiveObject3D[];
  camera?: LocalCameraResource;
  cameraObject?: PerspectiveCamera | OrthographicCamera;
  light?: LocalLightResource;
  lightObject?: Light;
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
    camera: nodeView.camera[0] ? waitForLocalResource<LocalCameraResource>(ctx, nodeView.camera[0]) : undefined,
    light: nodeView.light[0] ? waitForLocalResource<LocalLightResource>(ctx, nodeView.light[0]) : undefined,
  });

  const localNode: LocalNode = {
    resourceId,
    rendererNodeTripleBuffer,
    mesh: resources.mesh,
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
}

export function updateLocalNodeResources(
  ctx: RenderThreadState,
  rendererModule: RendererModuleState,
  nodes: LocalNode[]
) {
  const rendererState = getReadObjectBufferView(rendererModule.rendererStateTripleBuffer);
  const activeScene = rendererState.activeSceneResourceId[0];
  const sceneResource = getLocalResource<LocalSceneResource>(ctx, activeScene)?.resource;

  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const nodeResource = getLocalResource<LocalNode>(ctx, node.resourceId);

    if (nodeResource && nodeResource.statusView[1]) {
      const node = nodes[i];

      if (node.camera) {
        if (sceneResource && node.cameraObject) {
          sceneResource.scene.remove(node.cameraObject);
        }

        if (node.camera.type === CameraType.Perspective) {
          const index = rendererModule.perspectiveCameraResources.indexOf(node.camera);

          if (index !== -1) {
            rendererModule.perspectiveCameraResources.splice(index, 1);
          }
        } else if (node.camera.type === CameraType.Orthographic) {
          const index = rendererModule.orthographicCameraResources.indexOf(node.camera);

          if (index !== -1) {
            rendererModule.orthographicCameraResources.splice(index, 1);
          }
        }

        node.cameraObject = undefined;
        node.camera = undefined;
      }

      if (node.mesh) {
        if (sceneResource && node.meshPrimitiveObjects) {
          sceneResource.scene.remove(...node.meshPrimitiveObjects);
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
        if (sceneResource && node.lightObject) {
          sceneResource.scene.remove(node.lightObject);
        }

        node.lightObject = undefined;
        node.light = undefined;
      }

      nodes.splice(i, 1);
    }
  }

  if (!sceneResource) {
    return;
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeView = getReadObjectBufferView(node.rendererNodeTripleBuffer);
    updateNodeCamera(ctx, sceneResource.scene, node, nodeView);
    updateNodeLight(ctx, sceneResource.scene, node, nodeView);
    updateNodeMesh(ctx, sceneResource.scene, node, nodeView);
  }
}
