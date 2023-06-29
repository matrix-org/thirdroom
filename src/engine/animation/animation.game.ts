import RAPIER, { Capsule } from "@dimforge/rapier3d-compat";
import { defineQuery, exitQuery } from "bitecs";
import { vec3 } from "gl-matrix";
import { AnimationAction, AnimationMixer, Bone, Object3D, Quaternion, Vector3 } from "three";
import { radToDeg } from "three/src/math/MathUtils";

import { getForwardVector, getPitch, getRightVector, getYaw } from "../common/math";
import { maxEntities } from "../config.common";
import { GameContext } from "../GameTypes";
import { getModule } from "../module/module.common";
import { PhysicsModule, PhysicsModuleState } from "../physics/physics.game";
import { getRemoteResource, removeResourceRef } from "../resource/resource.game";
import { RemoteAnimation, RemoteNode } from "../resource/RemoteResources";
import { playerShapeCastCollisionGroups } from "../physics/CollisionGroups";

export interface IAnimationComponent {
  animations: RemoteAnimation[];
  mixer: AnimationMixer;
  actionMap: Map<string, AnimationAction>;
  actions: AnimationAction[];
}

export enum AnimationClipType {
  Fall2 = "Fall2",
  Fall1 = "Fall1",
  TurnLeft = "TurnLeft",
  TurnRight = "TurnRight",
  Idle = "Idle",
  StrafeLeft = "StrafeLeft",
  StrafeRight = "StrafeRight",
  Walk = "Walk",
  WalkBack = "WalkBack",
  StrafeLeftRun = "StrafeLeftRun",
  StrafeRightRun = "StrafeRightRun",
  Run = "Run",
  RunBack = "RunBack",
}

export const AnimationComponent = new Map<number, IAnimationComponent>();
export const BoneComponent = new Map<number, Bone>();

const animationQuery = defineQuery([AnimationComponent]);
const exitAnimationQuery = exitQuery(animationQuery);
const boneQuery = defineQuery([BoneComponent]);
const exitBoneQuery = exitQuery(boneQuery);

export function AnimationSystem(ctx: GameContext) {
  disposeAnimations(ctx);
  disposeBones(ctx);
  processAnimations(ctx);
  syncBones(ctx);
}

const _forward = vec3.create();
const _right = vec3.create();

const idleThreshold = 0.5;
const walkThreshold = 10;

const fadeInAmount = 8;
const fadeOutAmount = fadeInAmount / 2;

const lastYrot = new Float32Array(maxEntities);

const interactionGroup = playerShapeCastCollisionGroups;
const colliderShape = new Capsule(0.1, 0.5);
const shapeTranslationOffset = new Vector3(0, 0, 0);
const shapeRotationOffset = new Quaternion(0, 0, 0, 0);
const shapeCastPosition = new Vector3();
const shapeCastRotation = new Quaternion();
const _obj = new Object3D();

const isGrounded = (ctx: GameContext, physicsWorld: RAPIER.World, body: RAPIER.RigidBody) => {
  shapeCastPosition.copy(body.translation() as Vector3).add(shapeTranslationOffset);
  shapeCastRotation.copy(_obj.quaternion).multiply(shapeRotationOffset);

  const shapeCastResult = physicsWorld.castShape(
    shapeCastPosition,
    shapeCastRotation,
    physicsWorld.gravity,
    colliderShape,
    ctx.dt,
    true,
    0,
    interactionGroup
  );

  const isGrounded = !!shapeCastResult;

  return isGrounded;
};

function processAnimations(ctx: GameContext) {
  const physics = getModule(ctx, PhysicsModule);
  const ents = animationQuery(ctx.world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    // animation component exists on the inner avatar entity
    const animation = AnimationComponent.get(eid);
    const node = getRemoteResource<RemoteNode>(ctx, eid)!;

    // avatars exist within a parent container which has all other components for this entity
    const parent = node.parent;
    if (!parent) {
      console.warn("cannot find parent container for avatar:", eid);
      continue;
    }

    const body = parent.physicsBody?.body;

    if (animation && body) {
      // collectively fade all animations out each frame
      reduceClipActionWeights(animation.actions, fadeOutAmount * ctx.dt);

      // select actions to play based on velocity
      const actionsToPlay = getClipActionsUsingVelocity(ctx, physics, parent, body, animation);
      // synchronize selected clip action times
      synchronizeClipActions(actionsToPlay);
      // fade in selected animations
      increaseClipActionWeights(actionsToPlay, fadeInAmount * ctx.dt);

      animation.mixer.update(ctx.dt);
    }
  }
  return ctx;
}

function syncBones(ctx: GameContext) {
  // sync bone positions
  const bones = boneQuery(ctx.world);
  for (let i = 0; i < bones.length; i++) {
    const eid = bones[i];
    const bone = BoneComponent.get(eid);
    const node = getRemoteResource<RemoteNode>(ctx, eid);
    if (bone && node) {
      bone.position.toArray(node.position);
      bone.quaternion.toArray(node.quaternion);
    }
  }
  return ctx;
}

function reduceClipActionWeights(actions: AnimationAction[], amount: number) {
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (action.weight > 0) {
      action.weight -= amount;
    } else {
      action.enabled = false;
    }
  }
}

function synchronizeClipActions(actions: AnimationAction[]) {
  for (let i = 0; i < actions.length; i++) {
    const actionA = actions[i];
    const actionB = actions[i + 1];
    if (actionA && actionB) {
      const ratio = actionA.getClip().duration / actionB.getClip().duration;
      if (actionA.timeScale < 0 || actionB.timeScale < 0) {
        actionA.time = 1 - actionB.time * ratio;
      } else {
        actionA.time = actionB.time * ratio;
      }
    }
  }
}

function increaseClipActionWeights(actions: AnimationAction[], amount: number) {
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    action.enabled = true;
    if (action.weight < 1) {
      action.weight += amount;
    }
  }
}

function getClipActionsUsingVelocity(
  ctx: GameContext,
  physics: PhysicsModuleState,
  node: RemoteNode,
  body: RAPIER.RigidBody,
  animation: IAnimationComponent
): AnimationAction[] {
  const eid = node.eid;
  const quaternion = node.quaternion;

  if (!node.physicsBody) {
    throw new Error(`Physics body not found on node ${node.eid}`);
  }

  const linvel = node.physicsBody.velocity;

  const totalSpeed = linvel[0] ** 2 + linvel[2] ** 2;

  const pitch = getPitch(quaternion);
  const roll = getYaw(quaternion);
  const forward = getForwardVector(_forward, pitch, roll);
  const right = getRightVector(_right, roll);

  const angle = radToDeg(vec3.angle(linvel, forward));
  const angle2 = radToDeg(vec3.angle(linvel, right));

  const movingForward = angle < 50;
  const movingBackward = angle > 120;
  const strafingLeft = angle2 > 120;
  const strafingRight = angle2 < 50;

  const yRot = roll;
  const yRotLast = lastYrot[eid];
  const turningLeft = yRot - yRotLast > 0.1 * ctx.dt;
  const turningRight = yRot - yRotLast < -0.1 * ctx.dt;
  if (yRotLast !== yRot) {
    lastYrot[eid] = yRot;
  }

  const jumping = !isGrounded(ctx, physics.physicsWorld, body);

  // choose clip based on velocity
  const actions: AnimationAction[] = [];

  if (linvel[1] < -20) {
    actions.push(animation.actionMap.get(AnimationClipType.Fall2)!);
  } else if (jumping) {
    actions.push(animation.actionMap.get(AnimationClipType.Fall1)!);
  } else if (totalSpeed < idleThreshold) {
    if (turningLeft) {
      actions.push(animation.actionMap.get(AnimationClipType.TurnLeft)!);
    } else if (turningRight) {
      actions.push(animation.actionMap.get(AnimationClipType.TurnRight)!);
    } else {
      actions.push(animation.actionMap.get(AnimationClipType.Idle)!);
    }
  } else if (totalSpeed < walkThreshold) {
    if (strafingLeft) {
      actions.push(animation.actionMap.get(AnimationClipType.StrafeLeft)!);
      actions[actions.length - 1].setEffectiveTimeScale(1);
    } else if (strafingRight) {
      actions.push(animation.actionMap.get(AnimationClipType.StrafeRight)!);
      actions[actions.length - 1].setEffectiveTimeScale(1);
    }
    if (movingForward) {
      actions.push(animation.actionMap.get(AnimationClipType.Walk)!);
    } else if (movingBackward) {
      if (strafingLeft) {
        actions[actions.length - 1] = animation.actionMap.get(AnimationClipType.StrafeRight)!;
        actions[actions.length - 1].setEffectiveTimeScale(-1);
      } else if (strafingRight) {
        actions[actions.length - 1] = animation.actionMap.get(AnimationClipType.StrafeLeft)!;
        actions[actions.length - 1].setEffectiveTimeScale(-1);
      }
      actions.push(animation.actionMap.get(AnimationClipType.WalkBack)!);
    }
  } else {
    if (strafingLeft) {
      actions.push(animation.actionMap.get(AnimationClipType.StrafeLeftRun)!);
      actions[actions.length - 1].setEffectiveTimeScale(1);
    } else if (strafingRight) {
      actions.push(animation.actionMap.get(AnimationClipType.StrafeRightRun)!);
      actions[actions.length - 1].setEffectiveTimeScale(1);
    }
    if (movingForward) {
      actions.push(animation.actionMap.get(AnimationClipType.Run)!);
    } else if (movingBackward) {
      if (strafingLeft) {
        actions[actions.length - 1] = animation.actionMap.get(AnimationClipType.StrafeRightRun)!;
        actions[actions.length - 1].setEffectiveTimeScale(-1);
      } else if (strafingRight) {
        actions[actions.length - 1] = animation.actionMap.get(AnimationClipType.StrafeLeftRun)!;
        actions[actions.length - 1].setEffectiveTimeScale(-1);
      }
      actions.push(animation.actionMap.get(AnimationClipType.RunBack)!);
    }
  }

  return actions;
}

function disposeAnimations(ctx: GameContext) {
  const entities = exitAnimationQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    const { animations } = AnimationComponent.get(eid)!;

    for (let i = 0; i < animations.length; i++) {
      const animation = animations[i];
      removeResourceRef(ctx, animation.eid);
    }

    AnimationComponent.delete(eid);
  }
}

function disposeBones(ctx: GameContext) {
  const entities = exitBoneQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    BoneComponent.delete(eid);
  }
}
