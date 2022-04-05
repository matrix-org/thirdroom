import * as RAPIER from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";

import { GameState } from "../GameWorker";
import { addRenderableComponent, addTransformComponent } from "../component/transform";
import { addRigidBody } from "../physics";
import { createRemoteMaterial, MaterialType } from "../resources/MaterialResourceLoader";
import { createRemoteMesh } from "../resources/MeshResourceLoader";
import { createRemoteScene, SceneDefinition, SCENE_RESOURCE } from "../resources/SceneResourceLoader";
import { SetActiveCameraMessage, SetActiveSceneMessage, WorkerMessageType } from "../WorkerMessage";
import { CameraType, createRemoteCamera } from "../resources/CameraResourceLoader";
import { createRemoteLight, LightType, LIGHT_RESOURCE } from "../resources/LightResourceLoader";

export const createCube = (state: GameState, geometryResourceId: number) => {
  const { world, resourceManager, physicsWorld } = state;
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  const materialResourceId = createRemoteMaterial(resourceManager, {
    type: "material",
    materialType: MaterialType.Physical,
    baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
    roughnessFactor: 0.8,
    metallicFactor: 0.8,
  });

  const resourceId = createRemoteMesh(resourceManager, {
    type: "mesh",
    geometryResourceId,
    materialResourceId,
  });

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
  physicsWorld.createCollider(colliderDesc, rigidBody.handle);

  addRigidBody(world, eid, rigidBody);
  addRenderableComponent(state, eid, resourceId);

  return eid;
};

export function setActiveScene(state: GameState, eid: number) {
  state.renderer.port.postMessage({
    type: WorkerMessageType.SetActiveScene,
    eid,
  } as SetActiveSceneMessage);
  state.scene = eid;
}

export function createScene(state: GameState, sceneDef: Omit<SceneDefinition, "type">, setActive = true): number {
  const eid = addEntity(state.world);
  addTransformComponent(state.world, eid);
  const sceneResourceId = createRemoteScene(state.resourceManager, { type: SCENE_RESOURCE, ...sceneDef });
  addRenderableComponent(state, eid, sceneResourceId);

  if (setActive) {
    setActiveScene(state, eid);
  }

  return eid;
}

export function setActiveCamera(state: GameState, eid: number) {
  state.renderer.port.postMessage({
    type: WorkerMessageType.SetActiveCamera,
    eid,
  } as SetActiveCameraMessage);
  state.camera = eid;
}

export function createCamera(state: GameState, setActive = true): number {
  const eid = addEntity(state.world);
  addTransformComponent(state.world, eid);
  const cameraResource = createRemoteCamera(state.resourceManager, {
    type: "camera",
    cameraType: CameraType.Perspective,
    yfov: 75,
    znear: 0.1,
  });
  addRenderableComponent(state, eid, cameraResource);

  if (setActive) {
    setActiveCamera(state, eid);
  }

  return eid;
}

export function createDirectionalLight(state: GameState) {
  const eid = addEntity(state.world);
  addTransformComponent(state.world, eid);
  const lightResourceId = createRemoteLight(state.resourceManager, {
    type: LIGHT_RESOURCE,
    lightType: LightType.Directional,
    intensity: 0.5,
  });
  addRenderableComponent(state, eid, lightResourceId);
  return eid;
}
