import RAPIER, { Capsule } from "@dimforge/rapier3d-compat";
import { addComponent, defineQuery, enterQuery, hasComponent, IWorld, removeComponent } from "bitecs";
import { vec3 } from "gl-matrix";
import { AnimationAction, AnimationClip, AnimationMixer, Bone, Object3D, Quaternion, Vector3 } from "three";
import { radToDeg } from "three/src/math/MathUtils";

import { getForwardVector, getPitch, getRightVector, getRoll, Transform } from "../component/transform";
import { maxEntities } from "../config.common";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { Networked, Owned } from "../network/network.game";
// import { Networked } from "../network/network.game";
import { playerShapeCastCollisionGroups } from "../physics/CollisionGroups";
import { PhysicsModule, RigidBody } from "../physics/physics.game";

interface AnimationActionMap {
  Fall2: AnimationAction;
  Fall1: AnimationAction;
  TurnLeft: AnimationAction;
  TurnRight: AnimationAction;
  Idle: AnimationAction;
  StrafeLeft: AnimationAction;
  StrafeRight: AnimationAction;
  Walk: AnimationAction;
  WalkBack: AnimationAction;
  StrafeLeftRun: AnimationAction;
  StrafeRightRun: AnimationAction;
  Run: AnimationAction;
  RunBack: AnimationAction;
}

export interface IAnimationComponent {
  mixer: AnimationMixer;
  clips: AnimationClip[];
  actions: AnimationActionMap;
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
const enterAnimationQuery = enterQuery(animationQuery);
const boneQuery = defineQuery([BoneComponent]);

export function AnimationSystem(ctx: GameState) {
  initializeAnimations(ctx);
  processAnimations(ctx);
  syncBones(ctx);
}

const _vel = vec3.create();
const _forward = vec3.create();
const _right = vec3.create();

// TODO: reuse isGrounded for char controller
const interactionGroup = playerShapeCastCollisionGroups;
const colliderShape = new Capsule(0.1, 0.5);
const shapeTranslationOffset = new Vector3(0, 0, 0);
const shapeRotationOffset = new Quaternion(0, 0, 0, 0);
const shapeCastPosition = new Vector3();
const shapeCastRotation = new Quaternion();
const _obj = new Object3D();

const isGrounded = (ctx: GameState, physicsWorld: RAPIER.World, body: RAPIER.RigidBody) => {
  shapeCastPosition.copy(body.translation() as Vector3).add(shapeTranslationOffset);
  shapeCastRotation.copy(_obj.quaternion).multiply(shapeRotationOffset);

  const shapeCastResult = physicsWorld.castShape(
    shapeCastPosition,
    shapeCastRotation,
    physicsWorld.gravity,
    colliderShape,
    ctx.dt * 6,
    interactionGroup
  );

  const isGrounded = !!shapeCastResult;

  return isGrounded;
};

const idleThreshold = 0.5;
const walkThreshold = 10;

const fadeInAmount = 8;
const fadeOutAmount = fadeInAmount / 2;

const lastYrot = new Float32Array(maxEntities);

function initializeAnimations(ctx: GameState) {
  const entered = enterAnimationQuery(ctx.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const animation = AnimationComponent.get(eid);

    if (animation) {
      animation.actions = animation.clips.reduce((obj, clip) => {
        const action = animation.mixer.clipAction(clip).play();
        action.enabled = false;
        obj[clip.name as keyof AnimationActionMap] = action;
        return obj;
      }, {} as AnimationActionMap);
    }
  }
  return ctx;
}

function processAnimations(ctx: GameState) {
  const { physicsWorld } = getModule(ctx, PhysicsModule);
  const ents = animationQuery(ctx.world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    // animation component exists on the inner avatar entity
    const animation = AnimationComponent.get(eid);

    // avatars exist within a parent container which has all other components for this entity
    const parent = Transform.parent[eid];
    if (!parent) {
      console.warn("cannot find parent container for avatar:", eid);
      continue;
    }

    const rigidBody = RigidBody.store.get(parent);

    if (animation && rigidBody) {
      // collectively fade all animations out each frame
      const allActions: AnimationAction[] = Object.values(animation.actions);
      reduceClipActionWeights(allActions, fadeOutAmount * ctx.dt);

      // select actions to play based on velocity
      const actionsToPlay = getClipActionsUsingVelocity(ctx, physicsWorld, parent, rigidBody, animation);
      // synchronize selected clip action times
      synchronizeClipActions(actionsToPlay);
      // fade in selected animations
      increaseClipActionWeights(actionsToPlay, fadeInAmount * ctx.dt);

      animation.mixer.update(ctx.dt);
    }
  }
  return ctx;
}

function syncBones(ctx: GameState) {
  // sync bone positions
  const bones = boneQuery(ctx.world);
  for (let i = 0; i < bones.length; i++) {
    const eid = bones[i];
    const bone = BoneComponent.get(eid);
    if (bone) {
      const p = Transform.position[eid];
      const q = Transform.quaternion[eid];
      bone.position.toArray(p);
      bone.quaternion.toArray(q);
    }
  }
  return ctx;
}

function reduceClipActionWeights(actions: AnimationAction[], amount: number) {
  for (const action of actions) {
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
  for (const action of actions) {
    action.enabled = true;
    if (action.weight < 1) {
      action.weight += amount;
    }
  }
}

function getClipActionsUsingVelocity(
  ctx: GameState,
  physicsWorld: RAPIER.World,
  eid: number,
  rigidBody: RAPIER.RigidBody,
  animation: IAnimationComponent
): AnimationAction[] {
  const quaternion = Transform.quaternion[eid];

  // if remote object, take velocity from Networked component
  // otherwise, take velocity from entity's RigidBody
  const remote = hasComponent(ctx.world, Networked, eid) && !hasComponent(ctx.world, Owned, eid);
  const linvel = remote ? new Vector3().fromArray(Networked.velocity[eid]) : rigidBody.linvel();
  const vel = remote ? vec3.copy(_vel, Networked.velocity[eid]) : vec3.set(_vel, linvel.x, linvel.y, linvel.z);
  const totalSpeed = linvel.x ** 2 + linvel.z ** 2;

  const pitch = getPitch(quaternion);
  const roll = getRoll(quaternion);
  const forward = getForwardVector(_forward, pitch, roll);
  const right = getRightVector(_right, roll);

  const angle = radToDeg(vec3.angle(vel, forward));
  const angle2 = radToDeg(vec3.angle(vel, right));

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

  const jumping = !isGrounded(ctx, physicsWorld, rigidBody);

  // choose clip based on velocity
  const actions: AnimationAction[] = [];

  if (linvel.y < -20) {
    actions.push(animation.actions[AnimationClipType.Fall2]);
  } else if (jumping) {
    actions.push(animation.actions[AnimationClipType.Fall1]);
  } else if (totalSpeed < idleThreshold) {
    if (turningLeft) {
      actions.push(animation.actions[AnimationClipType.TurnLeft]);
    } else if (turningRight) {
      actions.push(animation.actions[AnimationClipType.TurnRight]);
    } else {
      actions.push(animation.actions[AnimationClipType.Idle]);
    }
  } else if (totalSpeed < walkThreshold) {
    if (strafingLeft) {
      actions.push(animation.actions[AnimationClipType.StrafeLeft]);
      actions[actions.length - 1].setEffectiveTimeScale(1);
    } else if (strafingRight) {
      actions.push(animation.actions[AnimationClipType.StrafeRight]);
      actions[actions.length - 1].setEffectiveTimeScale(1);
    }
    if (movingForward) {
      actions.push(animation.actions[AnimationClipType.Walk]);
    } else if (movingBackward) {
      if (strafingLeft) {
        actions[actions.length - 1] = animation.actions[AnimationClipType.StrafeRight];
        actions[actions.length - 1].setEffectiveTimeScale(-1);
      } else if (strafingRight) {
        actions[actions.length - 1] = animation.actions[AnimationClipType.StrafeLeft];
        actions[actions.length - 1].setEffectiveTimeScale(-1);
      }
      actions.push(animation.actions[AnimationClipType.WalkBack]);
    }
  } else {
    if (strafingLeft) {
      actions.push(animation.actions[AnimationClipType.StrafeLeftRun]);
      actions[actions.length - 1].setEffectiveTimeScale(1);
    } else if (strafingRight) {
      actions.push(animation.actions[AnimationClipType.StrafeRightRun]);
      actions[actions.length - 1].setEffectiveTimeScale(1);
    }
    if (movingForward) {
      actions.push(animation.actions[AnimationClipType.Run]);
    } else if (movingBackward) {
      if (strafingLeft) {
        actions[actions.length - 1] = animation.actions[AnimationClipType.StrafeRightRun];
        actions[actions.length - 1].setEffectiveTimeScale(-1);
      } else if (strafingRight) {
        actions[actions.length - 1] = animation.actions[AnimationClipType.StrafeLeftRun];
        actions[actions.length - 1].setEffectiveTimeScale(-1);
      }
      actions.push(animation.actions[AnimationClipType.RunBack]);
    }
  }

  return actions;
}

export function addAnimationComponent(world: IWorld, eid: number, props?: any) {
  addComponent(world, AnimationComponent, eid);
  AnimationComponent.set(eid, props);
}

export function removeAnimationComponent(world: IWorld, eid: number) {
  removeComponent(world, AnimationComponent, eid);
  AnimationComponent.delete(eid);
}
