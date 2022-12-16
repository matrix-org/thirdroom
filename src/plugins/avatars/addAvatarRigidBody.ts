import RAPIER from "@dimforge/rapier3d-compat";

import { GameState } from "../../engine/GameTypes";
import { playerCollisionGroups } from "../../engine/physics/CollisionGroups";
import { PhysicsModuleState, addRigidBody } from "../../engine/physics/physics.game";
import { AvatarOptions, AVATAR_HEIGHT, AVATAR_RADIUS } from "./common";

export function addAvatarRigidBody(
  ctx: GameState,
  { physicsWorld }: PhysicsModuleState,
  container: number,
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

  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  rigidBody.restrictRotations(false, false, false, true);

  const colliderDesc = RAPIER.ColliderDesc.capsule(height / 2, radius).setActiveEvents(
    RAPIER.ActiveEvents.CONTACT_EVENTS
  );

  colliderDesc.setCollisionGroups(collisionGroup);

  physicsWorld.createCollider(colliderDesc, rigidBody.handle);

  addRigidBody(ctx, container, rigidBody);
}
