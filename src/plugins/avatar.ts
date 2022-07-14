import RAPIER from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";

import { addTransformComponent, Transform, setQuaternionFromEuler, addChild } from "../engine/component/transform";
import { GameState } from "../engine/GameTypes";
import { inflateGLTFScene } from "../engine/gltf/gltf.game";
import { getModule } from "../engine/module/module.common";
import { addRemoteNodeComponent } from "../engine/node/node.game";
import { PhysicsModule, addRigidBody } from "../engine/physics/physics.game";

const AVATAR_COLLISION_GROUPS = 0x0ff0_f00f;

export function createContainerizedAvatar(ctx: GameState, uri: string) {
  const { physicsWorld } = getModule(ctx, PhysicsModule);

  const container = addEntity(ctx.world);
  addTransformComponent(ctx.world, container);
  addRemoteNodeComponent(ctx, container);

  const eid = addEntity(ctx.world);
  inflateGLTFScene(ctx, eid, uri, undefined, false);

  Transform.position[eid].set([0, -1, 0]);
  Transform.rotation[eid].set([0, Math.PI, 0]);
  Transform.scale[eid].set([1.3, 1.3, 1.3]);
  setQuaternionFromEuler(Transform.quaternion[eid], Transform.rotation[eid]);

  addChild(container, eid);

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.5).setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS);

  colliderDesc.setCollisionGroups(AVATAR_COLLISION_GROUPS);
  colliderDesc.setSolverGroups(AVATAR_COLLISION_GROUPS);

  physicsWorld.createCollider(colliderDesc, rigidBody.handle);
  addRigidBody(ctx.world, container, rigidBody);

  return container;
}
