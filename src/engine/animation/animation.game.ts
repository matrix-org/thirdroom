// import RAPIER, { Capsule } from "@dimforge/rapier3d-compat";
import { addComponent, defineQuery, enterQuery, IWorld, removeComponent } from "bitecs";
import { vec3 } from "gl-matrix";
import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  Bone,
  // Object3D,
  //  Quaternion,
  //  Vector3
} from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { radToDeg } from "three/src/math/MathUtils";

// import { createInteractionGroup, PhysicsGroups } from "../../plugins/PhysicsCharacterController";
import { addChild, setEulerFromQuaternion, Transform } from "../component/transform";
import { maxEntities } from "../config.common";
import { GameState } from "../GameTypes";
import { createSimpleCube } from "../mesh/mesh.game";
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
const enterAnimationQuery = enterQuery(animationQuery);
// const exitAnimationQuery = exitQuery(animationQuery);
const boneQuery = defineQuery([BoneComponent]);

const _vec3 = vec3.create();

// TODO: grounded shapecast for simpler jump detection
// export const CharacterShapecastInteractionGroup = createInteractionGroup(PhysicsGroups.All, ~0b1);
// const colliderShape = new Capsule(0.5, 0.5);
// const shapeTranslationOffset = new Vector3(0, 0, 0);
// const shapeRotationOffset = new Quaternion(0, 0, 0, 0);
// const shapeCastPosition = new Vector3();
// const shapeCastRotation = new Quaternion();
// const obj = new Object3D();
// const isGrounded = (ctx: GameState, physicsWorld: RAPIER.World, body: RAPIER.RigidBody) => {
//   shapeCastPosition.copy(body.translation() as Vector3).add(shapeTranslationOffset);
//   shapeCastRotation.copy(obj.quaternion).multiply(shapeRotationOffset);

//   const shapeCastResult = physicsWorld.castShape(
//     shapeCastPosition,
//     shapeCastRotation,
//     physicsWorld.gravity,
//     colliderShape,
//     ctx.dt,
//     CharacterShapecastInteractionGroup
//   );

//   const isGrounded = !!shapeCastResult;

//   return isGrounded;
// };

const fadeTime = 0.33;
const idleThreshold = 0.5;
const walkThreshold = 10;
const turnCounterAmount = 16;

const turnCounterObj: { [key: number]: number } = {};

const lastYrot = new Float32Array(maxEntities);

/*

notes on calculating forward/up/right:

  forward.x =  cos(pitch) * sin(yaw);
  forward.y = -sin(pitch);
  forward.z =  cos(pitch) * cos(yaw);

  right.x =  cos(yaw);
  right.y =  0;
  right.z = -sin(yaw);

  up = cross(forward, right);

  equivalent:
  up.x = sin(pitch) * sin(yaw);
  up.y = cos(pitch);
  up.z = sin(pitch) * cos(yaw);

*/

export function AnimationSystem(ctx: GameState) {
  const entered = enterAnimationQuery(ctx.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];

    const animation = AnimationComponent.get(eid);

    animation.debugEid = createSimpleCube(ctx, 0.333);
    // addChild(eid, animation.debugEid);
    addChild(ctx.activeScene, animation.debugEid);
  }

  const ents = animationQuery(ctx.world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    // animation component exists on the inner avatar entity
    const animation = AnimationComponent.get(eid);

    // avatars exist within a parent container which has all other components for this entity
    const parent = Transform.parent[eid] || eid;
    const rigidBody = RigidBody.store.get(parent);

    if (animation && rigidBody) {
      const position = Transform.position[parent];
      const quaternion = Transform.quaternion[parent];
      const rotation = Transform.rotation[parent];

      setEulerFromQuaternion(rotation, quaternion);

      const linvel = rigidBody.linvel();
      const vel: Float32Array = new Float32Array([linvel.x, linvel.y, linvel.z]);
      const len = linvel.x ** 2 + linvel.z ** 2;

      const yRot = rotation[1];
      const xRot = rotation[0];
      const yRotLast = lastYrot[eid];

      const [x, y, z, w] = quaternion;
      const roll = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * y * y - 2 * z * z);
      const pitch = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * x * x - 2 * z * z);
      // const yaw = Math.asin(2 * x * y + 2 * z * w);

      // TODO: figure out why roll is yaw and algo is inverted
      /* 
      correct algo:
      const x = Math.cos(pitch) * Math.sin(yaw);
      const y = -Math.sin(pitch);
      const z = Math.cos(pitch) * Math.cos(yaw);
      */
      const forward = vec3.set(
        vec3.create(),
        -Math.cos(pitch) * Math.sin(roll),
        Math.sin(pitch),
        -Math.cos(pitch) * Math.cos(roll)
      );

      const right = vec3.set(vec3.create(), Math.cos(roll), 0, -Math.sin(roll));

      // set to parent position manually
      vec3.copy(_vec3, position);

      // add forward vector
      vec3.add(_vec3, _vec3, forward);

      vec3.copy(Transform.position[animation.debugEid], _vec3);

      const angle = radToDeg(vec3.angle(vel, forward));
      const angle2 = radToDeg(vec3.angle(vel, right));

      // TODO: blend walking with strafing
      const movingForward = angle < 90;
      const movingBackward = angle > 100;
      const strafingLeft = angle2 > 120;
      const strafingRight = angle2 < 50;

      if (!turnCounterObj[eid]) turnCounterObj[eid] = 0;

      const turningLeft = xRot === 0 ? yRot > yRotLast : yRot < yRotLast;
      const turningRight = xRot === 0 ? yRot < yRotLast : yRot > yRotLast;

      let speed = 1;

      // choose clip based on velocity
      // TODO: strafing
      let clip: AnimationClip | undefined;
      if (turnCounterObj[eid] === 0) {
        if (linvel.y < -20) {
          clip = animation.threeResource.animations.find((c) => c.name === "Fall2");
        } else if (Math.abs(linvel.y) > 0.2) {
          clip = animation.threeResource.animations.find((c) => c.name === "Fall1");
        } else if (len < idleThreshold) {
          if (turningLeft) {
            clip = animation.threeResource.animations.find((c) => c.name === "TurnLeft");
            speed += Math.abs(yRot - yRotLast) * 42;
            if (speed < 2) turnCounterObj[eid] += turnCounterAmount;
            else {
              turnCounterObj[eid] += Math.round(turnCounterAmount / 10);
              speed *= 1.8;
            }
          } else if (turningRight) {
            clip = animation.threeResource.animations.find((c) => c.name === "TurnRight");
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
          if (strafingLeft) {
            clip = animation.threeResource.animations.find((c) => c.name === "StrafeLeft");
          } else if (strafingRight) {
            clip = animation.threeResource.animations.find((c) => c.name === "StrafeRight");
          } else if (movingForward) {
            clip = animation.threeResource.animations.find((c) => c.name === "Walk");
          } else if (movingBackward) {
            clip = animation.threeResource.animations.find((c) => c.name === "WalkBack");
          }
        } else {
          if (strafingLeft) {
            clip = animation.threeResource.animations.find((c) => c.name === "StrafeLeftRun");
          } else if (strafingRight) {
            clip = animation.threeResource.animations.find((c) => c.name === "StrafeRightRun");
          } else if (movingForward) {
            clip = animation.threeResource.animations.find((c) => c.name === "Run");
          } else if (movingBackward) {
            clip = animation.threeResource.animations.find((c) => c.name === "RunBack");
          }
        }

        // crossfade to new clip
        if (clip && animation.lastClip !== clip) {
          const lastClip = animation.lastClip;

          const currentAction = animation.mixer.clipAction(clip);
          if (lastClip) {
            const lastAction = animation.mixer.clipAction(lastClip);

            currentAction.syncWith(lastAction);
            const ratio = clip.duration / lastClip.duration;
            currentAction.time = lastAction.time * ratio;

            currentAction.enabled = true;
            lastAction.crossFadeTo(currentAction, fadeTime, true).play();

            // falling down
            if (
              linvel.y < 0 &&
              clip.name === "Fall1" &&
              (lastClip.name === "Idle" || lastClip.name === "Walk" || lastClip.name === "Run")
            ) {
              currentAction.setEffectiveTimeScale(-1).fadeOut(fadeTime * 8);
            }
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
