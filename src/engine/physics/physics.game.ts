import { defineComponent, defineQuery, addComponent, removeComponent, enterQuery, exitQuery, Types } from "bitecs";
import RAPIER, { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";

import { GameState, World } from "../GameTypes";
import { defineMapComponent } from "../ecs/MapComponent";
import { defineModule, getModule } from "../module/module.common";
import {
  addResourceRef,
  getRemoteResource,
  RemoteMesh,
  RemoteMeshPrimitive,
  RemoteNode,
  removeResourceRef,
} from "../resource/resource.game";

export interface PhysicsModuleState {
  physicsWorld: RAPIER.World;
  eventQueue: RAPIER.EventQueue;
  handleToEid: Map<number, number>;
  collisionHandlers: ((eid1?: number, eid2?: number, handle1?: number, handle2?: number) => void)[];
  characterController: RAPIER.KinematicCharacterController;
}

export const PhysicsModule = defineModule<GameState, PhysicsModuleState>({
  name: "physics",
  async create() {
    await RAPIER.init();

    const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
    const physicsWorld = new RAPIER.World(gravity);
    const handleToEid = new Map<number, number>();
    const eventQueue = new RAPIER.EventQueue(true);

    const characterController = physicsWorld.createCharacterController(0.5);
    characterController.setApplyImpulsesToDynamicBodies(true);
    characterController.enableAutostep(0.5, 0.5, false);

    return {
      physicsWorld,
      eventQueue,
      handleToEid,
      collisionHandlers: [],
      characterController,
    };
  },
  init(ctx) {},
});

const RigidBodySoA = defineComponent({
  velocity: [Types.f32, 3],
  meshResourceId: Types.ui32,
  primitiveResourceId: Types.ui32,
});

// data flows from rigidbody->transform
export const RigidBody = defineMapComponent<RapierRigidBody, typeof RigidBodySoA>(RigidBodySoA);

export const rigidBodyQuery = defineQuery([RigidBody]);
export const enteredRigidBodyQuery = enterQuery(rigidBodyQuery);
export const exitedRigidBodyQuery = exitQuery(rigidBodyQuery);

// data flows from transform->rigidbody
export const Kinematic = defineComponent();

const _v = new Vector3();
const _q = new Quaternion();
export const applyTransformToRigidBody = (body: RapierRigidBody, node: RemoteNode) => {
  body.setTranslation(_v.fromArray(node.position), true);
  body.setRotation(_q.fromArray(node.quaternion), true);
};

const applyRigidBodyToTransform = (body: RapierRigidBody, node: RemoteNode) => {
  if (body.bodyType() === RAPIER.RigidBodyType.Fixed) {
    return;
  }

  const rigidPos = body.translation();
  const rigidRot = body.rotation();
  const position = node.position;
  const quaternion = node.quaternion;

  position[0] = rigidPos.x;
  position[1] = rigidPos.y;
  position[2] = rigidPos.z;

  quaternion[0] = rigidRot.x;
  quaternion[1] = rigidRot.y;
  quaternion[2] = rigidRot.z;
  quaternion[3] = rigidRot.w;
};

export const SyncPhysicsSystem = (ctx: GameState) => {
  const { world } = ctx;
  const { physicsWorld, handleToEid } = getModule(ctx, PhysicsModule);

  // apply transform to rigidbody for new physics entities
  const entered = enteredRigidBodyQuery(world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];

    const body = RigidBody.store.get(eid);
    const node = getRemoteResource<RemoteNode>(ctx, eid);

    if (body && node) {
      if (body.bodyType() !== RAPIER.RigidBodyType.Fixed) {
        applyTransformToRigidBody(body, node);
      }

      handleToEid.set(body.handle, eid);
    }
  }

  // remove rigidbody from physics world
  const exited = exitedRigidBodyQuery(world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    const body = RigidBody.store.get(eid);
    if (body) {
      handleToEid.delete(body.handle);
      physicsWorld.removeRigidBody(body);
      RigidBody.store.delete(eid);

      if (RigidBody.meshResourceId[eid]) {
        removeResourceRef(ctx, RigidBody.meshResourceId[eid]);
      }

      if (RigidBody.primitiveResourceId[eid]) {
        removeResourceRef(ctx, RigidBody.primitiveResourceId[eid]);
      }
    }
  }

  // apply rigidbody to transform for regular physics entities
  const physicsEntities = rigidBodyQuery(world);
  for (let i = 0; i < physicsEntities.length; i++) {
    const eid = physicsEntities[i];
    const body = RigidBody.store.get(eid);
    const node = getRemoteResource<RemoteNode>(ctx, eid);

    if (node && body && body.bodyType() !== RAPIER.RigidBodyType.Fixed) {
      // sync velocity
      const linvel = body.linvel();
      const velocity = RigidBody.velocity[eid];
      velocity[0] = linvel.x;
      velocity[1] = linvel.y;
      velocity[2] = linvel.z;

      applyRigidBodyToTransform(body, node);
    }
  }
};

export function StepPhysicsSystem(ctx: GameState) {
  const { dt } = ctx;
  const { physicsWorld, handleToEid, eventQueue, collisionHandlers } = getModule(ctx, PhysicsModule);

  physicsWorld.timestep = dt;
  physicsWorld.step(eventQueue);

  eventQueue.drainCollisionEvents((handle1: number, handle2: number) => {
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

    for (const collisionHandler of collisionHandlers) {
      collisionHandler(eid1, eid2, handle1, handle2);
    }
  });
}

export function addRigidBody(
  ctx: GameState,
  node: RemoteNode,
  rigidBody: RapierRigidBody,
  meshResource?: RemoteMesh,
  primitiveResource?: RemoteMeshPrimitive
) {
  addComponent(ctx.world, RigidBody, node.eid);
  RigidBody.store.set(node.eid, rigidBody);

  if (meshResource) {
    addResourceRef(ctx, meshResource.eid);
    RigidBody.meshResourceId[node.eid] = meshResource.eid;
  }

  if (primitiveResource) {
    addResourceRef(ctx, primitiveResource.eid);
    RigidBody.primitiveResourceId[node.eid] = primitiveResource.eid;
  }
}

export function removeRigidBody(world: World, eid: number, rigidBody: RapierRigidBody) {
  removeComponent(world, RigidBody, eid);
  RigidBody.store.delete(eid);
}
