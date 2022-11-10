import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, addEntity } from "bitecs";

import { addTransformComponent, Transform, setQuaternionFromEuler, addChild } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { createGLTFEntity } from "../../engine/gltf/gltf.game";
import { getModule } from "../../engine/module/module.common";
import { addRemoteNodeComponent } from "../../engine/node/node.game";
import { playerCollisionGroups } from "../../engine/physics/CollisionGroups";
import { PhysicsModule, addRigidBody, PhysicsModuleState } from "../../engine/physics/physics.game";
import { InteractableType } from "../interaction/interaction.common";
import { addInteractableComponent } from "../interaction/interaction.game";
import { addNametag } from "../nametags/nametags.game";
import { AvatarComponent } from "./components";

const AVATAR_HEIGHT = 1;
const AVATAR_RADIUS = 0.5;

interface AvatarOptions {
  radius?: number;
  height?: number;
  kinematic?: boolean;
  nametag?: boolean;
  collisionGroup?: number;
}

export function createAvatar(ctx: GameState, uri: string, options: AvatarOptions = {}) {
  const physics = getModule(ctx, PhysicsModule);

  const container = addEntity(ctx.world);
  addTransformComponent(ctx.world, container);
  addRemoteNodeComponent(ctx, container);

  addAvatar(ctx, physics, uri, container, options);

  return container;
}

export function addAvatar(
  ctx: GameState,
  physics: PhysicsModuleState,
  uri: string,
  container: number,
  options: AvatarOptions = {}
) {
  const {
    height = AVATAR_HEIGHT,
    radius = AVATAR_RADIUS,
    kinematic = false,
    nametag = false,
    collisionGroup = playerCollisionGroups,
  } = options;
  const { physicsWorld } = physics;

  if (nametag) addNametag(ctx, height, container);

  const eid = createGLTFEntity(ctx, uri, { createTrimesh: false, isStatic: false });
  addComponent(ctx.world, AvatarComponent, eid);

  Transform.position[eid].set([0, -1, 0]);
  Transform.rotation[eid].set([0, Math.PI, 0]);
  Transform.scale[eid].set([1.3, 1.3, 1.3]);

  setQuaternionFromEuler(Transform.quaternion[eid], Transform.rotation[eid]);

  addChild(container, eid);

  const rigidBodyDesc = kinematic
    ? RAPIER.RigidBodyDesc.newKinematicPositionBased()
    : RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.capsule(height / 2, radius).setActiveEvents(
    RAPIER.ActiveEvents.CONTACT_EVENTS
  );

  colliderDesc.setCollisionGroups(collisionGroup);

  physicsWorld.createCollider(colliderDesc, rigidBody.handle);
  addRigidBody(ctx, container, rigidBody);
  addInteractableComponent(ctx, physics, container, InteractableType.Player);

  return eid;
}
