import { defineComponent, defineQuery, Types, addComponent, removeComponent } from "bitecs";
import { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";

import { GameState, World } from "../GameWorker";
import { Transform } from "../component/transform";
import { defineMapComponent } from "../ecs/MapComponent";

const RigidBodySoA = defineComponent({});
export const RigidBody = defineMapComponent<RapierRigidBody, typeof RigidBodySoA>(RigidBodySoA);

export const physicsQuery = defineQuery([RigidBody]);

export const physicsSystem = ({ world, physicsWorld, time }: GameState) => {
  // const entities = physicsQuery(world);

  // for (let i = 1; i < entities.length; i++) {
  //   const eid = entities[i];
  for (let i = 2; i < 1000; i++) {
    const eid = i;

    // const body = physics.objects[eid];
    const body = RigidBody.store.get(eid)!;

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

export const PhysicsCharacterController = defineComponent({
  // "internal"
  moveForce: [Types.f32, 3],
  dragForce: [Types.f32, 3],
  linearVelocity: [Types.f32, 3],
  isSliding: Types.ui8,
  lastSlideTime: Types.ui8,
  slideForce: [Types.f32, 3],

  // "external"
  walkSpeed: Types.f32,
  drag: Types.f32,
  maxWalkSpeed: Types.f32,
  jumpForce: Types.f32,
  inAirModifier: Types.f32,
  inAirDrag: Types.f32,
  crouchModifier: Types.f32,
  crouchJumpModifier: Types.f32,
  minSlideSpeed: Types.f32,
  slideModifier: Types.f32,
  slideDrag: Types.f32,
  slideCooldown: Types.f32,
  sprintModifier: Types.f32,
  maxSprintSpeed: Types.f32,
});

export const physicsCharacterControllerSystem = ({ world: World }: GameState) => {};
