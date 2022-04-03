import * as RAPIER from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";

import { GameState } from "../GameWorker";
import { addRenderableComponent, addTransformComponent } from "../component/transform";
import { addRigidBody } from "../physics";
import { createRemoteMaterial, MaterialType } from "../resources/MaterialResourceLoader";
import { createRemoteMesh } from "../resources/MeshResourceLoader";
import { createRemotePointLight } from "../resources/PointLightResourceLoader";

export const createCube = (state: GameState, geometryResourceId: number) => {
  const { world, resourceManager, physicsWorld } = state;
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  const materialResourceId = createRemoteMaterial(resourceManager, {
    type: "material",
    materialType: MaterialType.Lambert,
    baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
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

export const createPointLight = (state: GameState) => {
  const { world, resourceManager } = state;
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  const lightId = createRemotePointLight(resourceManager, {
    type: "point_light",
    color: 0xffffff,
    intensity: 1.0,
    distance: 0,
    decay: 1,
  });

  addRenderableComponent(state, eid, lightId);
  return eid;
};
