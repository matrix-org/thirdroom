import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent } from "bitecs";

import { GameState } from "../../engine/GameTypes";
import { playerCollisionGroups } from "../../engine/physics/CollisionGroups";
import { PhysicsModuleState, addRigidBody, Kinematic } from "../../engine/physics/physics.game";
import { RemoteNode } from "../../engine/resource/RemoteResources";
import { AvatarOptions, AVATAR_HEIGHT, AVATAR_RADIUS } from "./common";

export function addAvatarRigidBody(
  ctx: GameState,
  { physicsWorld }: PhysicsModuleState,
  container: RemoteNode,
  options: AvatarOptions = {}
) {
  const {
    height = AVATAR_HEIGHT,
    radius = AVATAR_RADIUS,
    kinematic = true,
    collisionGroup = playerCollisionGroups,
  } = options;

  const rigidBodyDesc = kinematic ? RAPIER.RigidBodyDesc.kinematicPositionBased() : RAPIER.RigidBodyDesc.dynamic();

  if (kinematic) addComponent(ctx.world, Kinematic, container.eid);

  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.capsule(height / 2, radius)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
    .setCollisionGroups(collisionGroup)
    .setTranslation(0, height / 2, 0);

  physicsWorld.createCollider(colliderDesc, rigidBody);

  addRigidBody(ctx, container, rigidBody);
}
