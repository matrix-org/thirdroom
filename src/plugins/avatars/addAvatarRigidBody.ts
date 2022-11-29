import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent } from "bitecs";

import { GameState } from "../../engine/GameTypes";
import { playerCollisionGroups } from "../../engine/physics/CollisionGroups";
import { PhysicsModuleState, addRigidBody, Kinematic } from "../../engine/physics/physics.game";
import { AvatarOptions, AVATAR_HEIGHT, AVATAR_RADIUS } from "./common";

export function addAvatarRigidBody(
  ctx: GameState,
  { physicsWorld }: PhysicsModuleState,
  eid: number,
  options: AvatarOptions = {}
) {
  const {
    height = AVATAR_HEIGHT,
    radius = AVATAR_RADIUS,
    kinematic = false,
    collisionGroup = playerCollisionGroups,
  } = options;

  const rigidBodyDesc = kinematic
    ? RAPIER.RigidBodyDesc.newKinematicPositionBased()
    : RAPIER.RigidBodyDesc.newDynamic();

  if (kinematic) addComponent(ctx.world, Kinematic, eid);

  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  // keep capsule upright
  rigidBody.restrictRotations(true, true, true, true);

  const colliderDesc = RAPIER.ColliderDesc.capsule(height / 2, radius).setActiveEvents(
    RAPIER.ActiveEvents.CONTACT_EVENTS
  );

  colliderDesc.setCollisionGroups(collisionGroup);

  physicsWorld.createCollider(colliderDesc, rigidBody.handle);

  addRigidBody(ctx, eid, rigidBody);
}
