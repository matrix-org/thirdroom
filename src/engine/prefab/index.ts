import * as RAPIER from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";

import { GameState, RenderPort } from "../GameWorker";
import { Transform } from "../component/transform";
import { addRigidBody } from "../physics";
import { createRemoteMaterial, MaterialType } from "../resources/MaterialResourceLoader";
import { createRemoteMesh } from "../resources/MeshResourceLoader";
import { WorkerMessageType } from "../WorkerMessage";

const rndRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const createCube = (
  { world, resourceManager, physicsWorld, renderer }: GameState,
  geometryResourceId: number
) => {
  const eid = addEntity(world);

  const position = Transform.position[eid];
  const scale = Transform.scale[eid];
  const rotation = Transform.rotation[eid];

  Transform.interpolate[eid] = 1;
  Transform.worldMatrixNeedsUpdate[eid] = 1;

  scale[0] = scale[1] = scale[2] = 1;

  position[0] = rndRange(-20, 20);
  position[1] = rndRange(5, 50);
  position[2] = rndRange(-20, 20);

  rotation[0] = rndRange(0, 5);
  rotation[1] = rndRange(0, 5);
  rotation[2] = rndRange(0, 5);

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

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic().setTranslation(position[0], position[1], position[2]);
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
  physicsWorld.createCollider(colliderDesc, rigidBody.handle);

  addRigidBody(world, eid, rigidBody);
  createRenderable(renderer.port, eid, resourceId);

  return eid;
};

export const createRenderable = (renderPort: RenderPort, eid: number, resourceId: number) => {
  renderPort.postMessage({ type: WorkerMessageType.AddRenderable, eid, resourceId });
};
