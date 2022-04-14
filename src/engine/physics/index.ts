import { defineComponent, defineQuery, addComponent, removeComponent, enterQuery, hasComponent } from "bitecs";
import { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";

import { GameState, World } from "../GameWorker";
import { setQuaternionFromEuler, Transform } from "../component/transform";
import { defineMapComponent } from "../ecs/MapComponent";
import { Owned, Networked } from "../network";

const RigidBodySoA = defineComponent({});
export const RigidBody = defineMapComponent<RapierRigidBody, typeof RigidBodySoA>(RigidBodySoA);

export const physicsQuery = defineQuery([RigidBody]);
export const enteredPhysicsQuery = enterQuery(physicsQuery);

export const PhysicsSystem = ({ world, physicsWorld, time }: GameState) => {
  const entered = enteredPhysicsQuery(world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const position = Transform.position[eid];
    const rotation = Transform.rotation[eid];
    const quaternion = Transform.quaternion[eid];
    setQuaternionFromEuler(quaternion, rotation);

    const body = RigidBody.store.get(eid);
    if (body) {
      body.setTranslation(new Vector3().fromArray(position), true);
      body.setRotation(new Quaternion().fromArray(quaternion), true);
    }
  }

  const entities = physicsQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    const body = RigidBody.store.get(eid);

    if (body) {
      // lock networked objects that aren't owned
      if (hasComponent(world, Networked, eid) && !hasComponent(world, Owned, eid)) {
        const position = Transform.position[eid];
        const quaternion = Transform.quaternion[eid];
        body.setTranslation(new Vector3().fromArray(position), true);
        body.setRotation(new Quaternion().fromArray(quaternion), true);
      } else {
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
