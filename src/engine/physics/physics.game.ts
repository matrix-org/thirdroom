import {
  defineComponent,
  defineQuery,
  addComponent,
  removeComponent,
  enterQuery,
  hasComponent,
  exitQuery,
  Types,
} from "bitecs";
import RAPIER, { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";

import { GameState, World } from "../GameTypes";
import { setQuaternionFromEuler, Transform } from "../component/transform";
import { defineMapComponent } from "../ecs/MapComponent";
import { Networked, Owned } from "../network/network.game";
import { defineModule, getModule } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { addResourceRef, disposeResource } from "../resource/resource.game";

export interface PhysicsModuleState {
  physicsWorld: RAPIER.World;
  eventQueue: RAPIER.EventQueue;
  handleToEid: Map<number, number>;
  drainContactEvents: (callback: (eid1: number, eid2: number) => void) => void;
  collisionHandlers: ((eid1?: number, eid2?: number, handle1?: number, handle2?: number) => void)[];
}

export const PhysicsModule = defineModule<GameState, PhysicsModuleState>({
  name: "physics",
  async create() {
    await RAPIER.init();

    const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
    const physicsWorld = new RAPIER.World(gravity);
    const handleToEid = new Map<number, number>();
    const eventQueue = new RAPIER.EventQueue(true);

    const drainContactEvents = (callback: (eid1: number, eid2: number, handle1: number, handle2: number) => void) => {
      eventQueue.drainContactEvents((handle1, handle2) => {
        const eid1 = handleToEid.get(handle1);
        if (eid1 === undefined) {
          console.warn(`Contact with unregistered physics handle ${handle1}`);
          // return;
        }
        const eid2 = handleToEid.get(handle2);
        if (eid2 === undefined) {
          console.warn(`Contact with unregistered physics handle ${handle2}`);
          // return;
        }
        callback(eid1!, eid2!, handle1, handle2);
      });
    };

    return {
      physicsWorld,
      eventQueue,
      handleToEid,
      drainContactEvents,
      collisionHandlers: [],
    };
  },
  init(ctx) {},
});

const RigidBodySoA = defineComponent({
  velocity: [Types.f32, 3],
  meshResourceId: Types.ui32,
  primitiveResourceId: Types.ui32,
});
export const RigidBody = defineMapComponent<RapierRigidBody, typeof RigidBodySoA>(RigidBodySoA);

export const physicsQuery = defineQuery([RigidBody]);
export const enteredPhysicsQuery = enterQuery(physicsQuery);
export const exitedPhysicsQuery = exitQuery(physicsQuery);

export const applyTransformToRigidBody = (body: RapierRigidBody, eid: number) => {
  const position = Transform.position[eid];
  const quaternion = Transform.quaternion[eid];
  body.setTranslation(new Vector3().fromArray(position), true);
  body.setRotation(new Quaternion().fromArray(quaternion), true);
};

const applyRigidBodyToTransform = (body: RapierRigidBody, eid: number) => {
  if (body.isStatic()) {
    return;
  }

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
};

export const PhysicsSystem = (state: GameState) => {
  const { world, dt } = state;
  const { physicsWorld, handleToEid, eventQueue, collisionHandlers } = getModule(state, PhysicsModule);

  // apply transform to rigidbody for new physics entities
  const entered = enteredPhysicsQuery(world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];

    const body = RigidBody.store.get(eid);

    if (body) {
      if (!body.isStatic()) {
        const rotation = Transform.rotation[eid];
        const quaternion = Transform.quaternion[eid];
        setQuaternionFromEuler(quaternion, rotation);
        applyTransformToRigidBody(body, eid);
      }

      handleToEid.set(body.handle, eid);
    }
  }

  // remove rigidbody from physics world
  const exited = exitedPhysicsQuery(world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    const body = RigidBody.store.get(eid);
    if (body) {
      handleToEid.delete(body.handle);
      physicsWorld.removeRigidBody(body);
      RigidBody.store.delete(eid);

      if (RigidBody.meshResourceId[eid]) {
        disposeResource(state, RigidBody.meshResourceId[eid]);
      }

      if (RigidBody.primitiveResourceId[eid]) {
        disposeResource(state, RigidBody.primitiveResourceId[eid]);
      }
    }
  }

  // apply rigidbody to transform for regular physics entities
  const physicsEntities = physicsQuery(world);
  for (let i = 0; i < physicsEntities.length; i++) {
    const eid = physicsEntities[i];
    const body = RigidBody.store.get(eid);

    if (body && !body.isStatic()) {
      // sync velocity
      const linvel = body.linvel();
      const velocity = RigidBody.velocity[eid];
      velocity[0] = linvel.x;
      velocity[1] = linvel.y;
      velocity[2] = linvel.z;

      // skip remote networked physics bodies
      if (hasComponent(world, Networked, eid) && !hasComponent(world, Owned, eid)) {
        continue;
      } else {
        applyRigidBodyToTransform(body, eid);
      }
    }
  }

  physicsWorld.timestep = dt;
  physicsWorld.step(eventQueue);

  eventQueue.drainContactEvents((handle1, handle2) => {
    const eid1 = handleToEid.get(handle1);
    const eid2 = handleToEid.get(handle2);
    for (const collisionHandler of collisionHandlers) {
      collisionHandler(eid1, eid2, handle1, handle2);
    }
  });
};

export function addRigidBody(
  ctx: GameState,
  eid: number,
  rigidBody: RapierRigidBody,
  meshResourceId?: ResourceId,
  primitiveResourceId?: ResourceId
) {
  addComponent(ctx.world, RigidBody, eid);
  RigidBody.store.set(eid, rigidBody);

  if (meshResourceId) {
    addResourceRef(ctx, meshResourceId);
  }

  if (primitiveResourceId) {
    addResourceRef(ctx, primitiveResourceId);
  }

  RigidBody.meshResourceId[eid] = meshResourceId || 0;
  RigidBody.primitiveResourceId[eid] = primitiveResourceId || 0;
}

export function removeRigidBody(world: World, eid: number, rigidBody: RapierRigidBody) {
  removeComponent(world, RigidBody, eid);
  RigidBody.store.delete(eid);
}
