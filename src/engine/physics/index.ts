import { defineComponent, defineQuery, addComponent, removeComponent } from "bitecs";
import { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";

import { GameState, World } from "../GameWorker";
import { Transform } from "../component/transform";
import { defineMapComponent } from "../ecs/MapComponent";

const RigidBodySoA = defineComponent({});
export const RigidBody = defineMapComponent<RapierRigidBody, typeof RigidBodySoA>(RigidBodySoA);

export const physicsQuery = defineQuery([RigidBody]);

export const PhysicsSystem = ({ world, physicsWorld, time }: GameState) => {
  const entities = physicsQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    const body = RigidBody.store.get(eid);

    if (body) {
      const rigidPos = body.translation();
      const rigidRot = body.rotation();
      const position = Transform.position[eid];
      const quaternion = Transform.quaternion[eid];

      position[0] = rigidPos.x;
      position[1] = rigidPos.y;
      position[2] = rigidPos.z;

      quaternion[0] = rigidRot.x;
      quaternion[1] = rigidRot.y;
      quaternion[2] = rigidRot.z;
      quaternion[3] = rigidRot.w;
    }
  }

  physicsWorld.timestep = time.dt;
  physicsWorld.step();
};

export function addRigidBody(world: World, eid: number, rigidBody: RapierRigidBody) {
  addComponent(world, RigidBody, eid);
  RigidBody.store.set(eid, rigidBody);
}

export function removeRigidBody(world: World, eid: number, rigidBody: RapierRigidBody) {
  removeComponent(world, RigidBody, eid);
  RigidBody.store.delete(eid);
}
