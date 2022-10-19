import RAPIER from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";

import { addTransformComponent, Transform, setQuaternionFromEuler, addChild } from "../engine/component/transform";
import { GameState } from "../engine/GameTypes";
import { createGLTFEntity } from "../engine/gltf/gltf.game";
import { getModule } from "../engine/module/module.common";
import { addRemoteNodeComponent } from "../engine/node/node.game";
import { playerCollisionGroups } from "../engine/physics/CollisionGroups";
import { PhysicsModule, addRigidBody } from "../engine/physics/physics.game";
import { InteractableType } from "./interaction/interaction.common";
import { addInteractableComponent } from "./interaction/interaction.game";
import { addNametag } from "./nametags/nametags.game";

const AVATAR_HEIGHT = 1;
const AVATAR_RADIUS = 0.5;

interface AvatarOptions {
  radius?: number;
  height?: number;
  kinematic?: boolean;
  nametag?: boolean;
}

export function createAvatar(ctx: GameState, uri: string, options: AvatarOptions = {}) {
  const { physicsWorld } = getModule(ctx, PhysicsModule);

  const container = addEntity(ctx.world);
  addTransformComponent(ctx.world, container);
  addRemoteNodeComponent(ctx, container);

  addAvatar(ctx, uri, physicsWorld, container, options);

  return container;
}

export function addAvatar(
  ctx: GameState,
  uri: string,
  physicsWorld: RAPIER.World,
  container: number,
  options: AvatarOptions = {}
) {
  const { height = AVATAR_HEIGHT, radius = AVATAR_RADIUS, kinematic = false, nametag = false } = options;

  if (nametag) addNametag(ctx, height, container);

  const eid = createGLTFEntity(ctx, uri, { createTrimesh: false, isStatic: false });

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

  colliderDesc.setCollisionGroups(playerCollisionGroups);

  physicsWorld.createCollider(colliderDesc, rigidBody.handle);
  addRigidBody(ctx, container, rigidBody);
  addInteractableComponent(ctx, container, InteractableType.Player);
}
