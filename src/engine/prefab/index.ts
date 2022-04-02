import * as RAPIER from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";

import { GameState } from "../GameWorker";
import { addRenderableComponent, addTransformComponent } from "../component/transform";
import { addRigidBody } from "../physics";
import { createRemoteMaterial, MaterialType } from "../resources/MaterialResourceLoader";
import { createRemoteMesh } from "../resources/MeshResourceLoader";

export const createCube = (state: GameState, geometryResourceId: number) => {
  const { world, resourceManager, physicsWorld } = state;
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  const materialResourceId = createRemoteMaterial(resourceManager, {
    type: "material",
    materialType: MaterialType.Unlit,
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
