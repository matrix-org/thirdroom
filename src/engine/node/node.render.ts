import { TilesRenderer } from "3d-tiles-renderer";
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
  Bone,
  Camera,
} from "three";

import { updateNodeCamera } from "../camera/camera.render";
import { clamp } from "../component/transform";
import { tickRate } from "../config.common";
import { updateNodeLight } from "../light/light.render";
import {
  RendererInstancedMeshResource,
  RendererLightMapResource,
  RendererMeshResource,
  RendererSkinResource,
  updateNodeMesh,
} from "../mesh/mesh.render";
import {
  RendererReflectionProbeResource,
  updateNodeReflectionProbe,
} from "../reflection-probe/reflection-probe.render";
import { ReflectionProbe } from "../reflection-probe/ReflectionProbe";
import { RendererModuleState, RenderThreadState } from "../renderer/renderer.render";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { getLocalResources } from "../resource/resource.render";
import { LocalCamera, LocalLight, LocalTilesRenderer, NodeResource } from "../resource/schema";
import { LocalSceneResource } from "../scene/scene.render";
import { updateNodeTilesRenderer } from "../tiles-renderer/tiles-renderer.render";

type PrimitiveObject3D = Mesh | SkinnedMesh | Line | LineSegments | LineLoop | Points | InstancedMesh;

export class RendererNodeResource extends defineLocalResourceClass<typeof NodeResource>(NodeResource) {
  declare mesh: RendererMeshResource | undefined;
  currentMeshResourceId = 0;
  declare instancedMesh: RendererInstancedMeshResource | undefined;
  declare lightMap: RendererLightMapResource | undefined;
  declare skin: RendererSkinResource | undefined;
  bone?: Bone;
  meshPrimitiveObjects?: PrimitiveObject3D[];
  declare camera: LocalCamera | undefined;
  currentCameraResourceId = 0;
  cameraObject?: PerspectiveCamera | OrthographicCamera;
  declare light: LocalLight | undefined;
  currentLightResourceId = 0;
  lightObject: Light | undefined;
  declare tilesRenderer: LocalTilesRenderer | undefined;
  tilesRendererObject?: TilesRenderer;
  tilesRendererCamera?: Camera;
  currentTilesRendererResourceId = 0;
  declare reflectionProbe: RendererReflectionProbeResource | undefined;
  currentReflectionProbeResourceId = 0;
  reflectionProbeObject?: ReflectionProbe;

  async load() {
    console.log(this.mesh, this.__props.mesh);
  }

  dispose() {
    if (this.meshPrimitiveObjects) {
      for (let i = 0; i < this.meshPrimitiveObjects.length; i++) {
        const primitive = this.meshPrimitiveObjects[i];
        primitive.parent?.remove(primitive);

        if (primitive instanceof SkinnedMesh) {
          for (let j = 0; j < primitive.skeleton.bones.length; j++) {
            const bone = primitive.skeleton.bones[j];
            bone.parent?.remove(bone);
          }
          primitive.skeleton.dispose();
        }

        if (primitive instanceof InstancedMesh) {
          primitive.geometry.dispose();
        }
      }
    }

    if (this.cameraObject) {
      this.cameraObject.parent?.remove(this.cameraObject);
    }

    if (this.lightObject) {
      this.lightObject.parent?.remove(this.lightObject);
    }

    if (this.reflectionProbeObject) {
      this.reflectionProbeObject.parent?.remove(this.reflectionProbeObject);
    }

    if (this.tilesRendererObject) {
      const obj = this.tilesRendererObject.group;
      obj.parent?.remove(obj);
      this.tilesRendererObject.dispose();
    }
  }
}

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();

export function updateTransformFromNode(ctx: RenderThreadState, node: RendererNodeResource, object3D: Object3D) {
  if (node.skipLerp) {
    setTransformFromNode(ctx, node, object3D);
    return;
  }

  const frameRate = 1 / ctx.dt;
  const lerpAlpha = clamp(tickRate / frameRate, 0, 1);

  tempMatrix4.fromArray(node.worldMatrix);
  tempMatrix4.decompose(tempPosition, tempQuaternion, tempScale);

  // TODO: Optimize static objects
  object3D.position.lerp(tempPosition, lerpAlpha);
  object3D.quaternion.slerp(tempQuaternion, lerpAlpha);
  object3D.scale.lerp(tempScale, lerpAlpha);

  object3D.visible = !!node.visible;
  object3D.layers.mask = node.layers;
}

export function setTransformFromNode(
  ctx: RenderThreadState,
  node: RendererNodeResource,
  object3D: Object3D,
  inverseMatrix?: Matrix4
) {
  tempMatrix4.fromArray(node.worldMatrix);

  if (inverseMatrix) tempMatrix4.premultiply(inverseMatrix);

  tempMatrix4.decompose(tempPosition, tempQuaternion, tempScale);

  object3D.position.copy(tempPosition);
  object3D.quaternion.copy(tempQuaternion);
  object3D.scale.copy(tempScale);

  object3D.visible = !!node.visible;
}

export function updateLocalNodeResources(
  ctx: RenderThreadState,
  rendererModule: RendererModuleState,
  activeSceneResource: LocalSceneResource | undefined,
  activeCameraNode: RendererNodeResource | undefined
) {
  const nodes = getLocalResources(ctx, RendererNodeResource);

  if (!activeSceneResource) {
    return;
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    updateNodeCamera(ctx, activeSceneResource.scene, node);
    updateNodeLight(ctx, activeSceneResource.scene, node);
    updateNodeReflectionProbe(ctx, activeSceneResource.scene, node);
    updateNodeMesh(ctx, activeSceneResource, node);
    updateNodeTilesRenderer(ctx, activeSceneResource.scene, activeCameraNode, node);
  }
}
