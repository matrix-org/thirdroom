import { addComponent, defineQuery, IWorld, removeComponent } from "bitecs";
import { AnimationAction, AnimationClip, AnimationMixer, Bone } from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

import { setEulerFromQuaternion, Transform } from "../component/transform";
import { maxEntities } from "../config.common";
import { GameState } from "../GameTypes";
import { RigidBody } from "../physics/physics.game";

export interface IAnimationComponent {
  threeResource: GLTF;
  mixer: AnimationMixer;
  clips: AnimationClip[];
  lastClip?: AnimationClip;
  actions: AnimationAction[];
}

export const AnimationComponent = new Map<number, IAnimationComponent>();
export const BoneComponent = new Map<number, Bone>();

const animationQuery = defineQuery([AnimationComponent]);
// const enterAnimationQuery = enterQuery(animationQuery);
// const exitAnimationQuery = exitQuery(animationQuery);
const boneQuery = defineQuery([BoneComponent]);

const fadeTime = 0.4;
const idleThreshold = 0.5;
const walkThreshold = 10;
const turnCounterAmount = 16;

const turnCounterObj: { [key: number]: number } = {};

const lastYrot = new Float32Array(maxEntities);

export function AnimationSystem(ctx: GameState) {
  // const entered = enterAnimationQuery(ctx.world);
  // for (let i = 0; i < entered.length; i++) {
  //   const eid = entered[i];

  //   const animation = AnimationComponent.get(eid);
  // }

  const ents = animationQuery(ctx.world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const parent = Transform.parent[eid];
    const animation = AnimationComponent.get(eid);
    const rigidBody = RigidBody.store.get(parent || eid);
    if (animation && rigidBody) {
      const linvel = rigidBody.linvel();
      const len = linvel.x ** 2 + linvel.z ** 2;

      setEulerFromQuaternion(Transform.rotation[parent], Transform.quaternion[parent]);
      const yRot = Transform.rotation[parent][1];
      const xRot = Transform.rotation[parent][0];
      const yRotLast = lastYrot[eid];

      if (!turnCounterObj[eid]) turnCounterObj[eid] = 0;

      const turningLeft = xRot === 0 ? yRot > yRotLast : yRot < yRotLast;
      const turningRight = xRot === 0 ? yRot < yRotLast : yRot > yRotLast;

      let speed = 1;

      // choose clip based on velocity
      // TODO: strafing & walking backwards
      let clip: AnimationClip | undefined;
      if (turnCounterObj[eid] === 0) {
        if (linvel.y < -20) {
          clip = animation.threeResource.animations.find((c) => c.name === "Fall2");
        } else if (Math.abs(linvel.y) > 0.2) {
          clip = animation.threeResource.animations.find((c) => c.name === "Fall1");
        } else if (len < idleThreshold) {
          if (turningLeft) {
            clip = animation.threeResource.animations.find((c) => c.name === "LeftTurn");
            speed += Math.abs(yRot - yRotLast) * 42;
            if (speed < 2) turnCounterObj[eid] += turnCounterAmount;
            else {
              turnCounterObj[eid] += Math.round(turnCounterAmount / 10);
              speed *= 1.8;
            }
          } else if (turningRight) {
            clip = animation.threeResource.animations.find((c) => c.name === "RightTurn");
            speed += Math.abs(yRot - yRotLast) * 42;
            if (speed < 2) turnCounterObj[eid] -= turnCounterAmount;
            else {
              turnCounterObj[eid] -= Math.round(turnCounterAmount / 10);
              speed *= 1.8;
            }
          } else {
            clip = animation.threeResource.animations.find((c) => c.name === "Idle");
          }
        } else if (len < walkThreshold) {
          clip = animation.threeResource.animations.find((c) => c.name === "Walk");
        } else {
          clip = animation.threeResource.animations.find((c) => c.name === "Run");
        }
        if (clip && animation.lastClip !== clip) {
          const lastClip = animation.lastClip;

          const currentAction = animation.mixer.clipAction(clip);
          if (lastClip) {
            const lastAction = animation.mixer.clipAction(lastClip);
            const ratio = clip.duration / lastClip.duration;
            currentAction.enabled = true;
            currentAction.time = lastAction.time * ratio;
            lastAction.crossFadeTo(currentAction, fadeTime, true).play();
          } else currentAction.fadeIn(fadeTime).play();
        }
        animation.lastClip = clip;
      }

      animation.mixer.update(ctx.dt * speed);

      if (turnCounterObj[eid] < 0) turnCounterObj[eid]++;
      else if (turnCounterObj[eid] > 0) turnCounterObj[eid]--;

      if (yRotLast !== yRot) {
        lastYrot[eid] = yRot;
      }
    }
  }

  // sync bone positions
  const bones = boneQuery(ctx.world);
  for (let i = 0; i < bones.length; i++) {
    const eid = bones[i];
    const bone = BoneComponent.get(eid);
    if (bone) {
      const p = Transform.position[eid];
      const q = Transform.quaternion[eid];
      p.set(bone.position.toArray());
      q.set(bone.quaternion.toArray());
    }
  }
}

export function addAnimationComponent(world: IWorld, eid: number, props?: any) {
  addComponent(world, AnimationComponent, eid);
  AnimationComponent.set(eid, props);
}

export function removeAnimationComponent(world: IWorld, eid: number) {
  removeComponent(world, AnimationComponent, eid);
  AnimationComponent.delete(eid);
}
