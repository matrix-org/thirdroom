import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent } from "bitecs";

import { GameState } from "../GameTypes";
import { playerCollisionGroups } from "../physics/CollisionGroups";
import { PhysicsModuleState, addRigidBody, Kinematic } from "../physics/physics.game";
import { RemoteNode } from "../resource/RemoteResources";
import { AvatarOptions, AVATAR_CAPSULE_RADIUS, AVATAR_CAPSULE_HEIGHT } from "./common";

export function addAvatarRigidBody(
  ctx: GameState,
  { physicsWorld }: PhysicsModuleState,
  container: RemoteNode,
  options: AvatarOptions = {}
) {
  const {
    height = AVATAR_CAPSULE_HEIGHT,
    radius = AVATAR_CAPSULE_RADIUS,
    kinematic = true,
    collisionGroup = playerCollisionGroups,
  } = options;

  const rigidBodyDesc = kinematic ? RAPIER.RigidBodyDesc.kinematicPositionBased() : RAPIER.RigidBodyDesc.dynamic();

  if (kinematic) addComponent(ctx.world, Kinematic, container.eid);

  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.capsule(height / 2, radius)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
    .setCollisionGroups(collisionGroup)
    .setTranslation(0, height - 0.1, 0);

  physicsWorld.createCollider(colliderDesc, rigidBody);

  addRigidBody(ctx, container, rigidBody);
}
