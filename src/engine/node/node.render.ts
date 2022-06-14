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
import { LocalCameraResource, updateNodeCamera } from "../camera/camera.render";
import { clamp } from "../component/transform";
import { tickRate } from "../config.common";
import { LocalLightResource, updateNodeLight } from "../light/light.render";
import { LocalMesh } from "../mesh/mesh.render";
import { RendererModuleState, RenderThreadState } from "../renderer/renderer.render";
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
  const nodeView = getReadObjectBufferView(rendererNodeTripleBuffer);

  const resources = await promiseObject({
    mesh: nodeView.mesh[0] ? waitForLocalResource<LocalMesh>(ctx, nodeView.mesh[0]) : undefined,
    camera: nodeView.camera[0] ? waitForLocalResource<LocalCameraResource>(ctx, nodeView.camera[0]) : undefined,
    light: nodeView.light[0] ? waitForLocalResource<LocalLightResource>(ctx, nodeView.light[0]) : undefined,
  });

  return {
    resourceId,
    rendererNodeTripleBuffer,
    mesh: resources.mesh,
    camera: resources.camera,
    light: resources.light,
  };
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

  if (!sceneResource) {
    return;
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeView = getReadObjectBufferView(node.rendererNodeTripleBuffer);
    updateNodeCamera(ctx, sceneResource.scene, node, nodeView);
    updateNodeLight(ctx, sceneResource.scene, node, nodeView);
    // TODO: implement this
    // updateNodeMesh(ctx, sceneResource.scene, node, nodeView);
  }
}
