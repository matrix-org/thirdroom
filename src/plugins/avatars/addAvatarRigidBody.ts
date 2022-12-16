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
    kinematic = true,
    collisionGroup = playerCollisionGroups,
  } = options;

  const rigidBodyDesc = kinematic ? RAPIER.RigidBodyDesc.kinematicPositionBased() : RAPIER.RigidBodyDesc.dynamic();

  if (kinematic) addComponent(ctx.world, Kinematic, eid);

  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  if (!kinematic) rigidBody.lockRotations(true, true);

  const colliderDesc = RAPIER.ColliderDesc.capsule(height / 2, radius).setActiveEvents(
    RAPIER.ActiveEvents.COLLISION_EVENTS
  );

  colliderDesc.setCollisionGroups(collisionGroup);

  physicsWorld.createCollider(colliderDesc, rigidBody);

  addRigidBody(ctx, eid, rigidBody);
}
