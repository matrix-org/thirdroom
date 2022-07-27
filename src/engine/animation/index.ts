import { addComponent, defineQuery, IWorld, removeComponent } from "bitecs";
import { AnimationAction, AnimationClip, AnimationMixer, Bone } from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

import { Transform } from "../component/transform";
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

const idleThreshold = 0.5;
const walkThreshold = 10;

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

      animation.clips.forEach((clip) => {
        if (animation.lastClip === clip) return;
        animation.mixer.clipAction(clip).stop();
      });

      let clip: AnimationClip | undefined;
      if (linvel.y < -20) {
        clip = animation.threeResource.animations.find((c) => c.name === "Fall2");
      } else if (Math.abs(linvel.y) > 0.2) {
        clip = animation.threeResource.animations.find((c) => c.name === "Fall1");
      } else if (len < idleThreshold) {
        clip = animation.threeResource.animations.find((c) => c.name === "Idle");
      } else if (len < walkThreshold) {
        clip = animation.threeResource.animations.find((c) => c.name === "Walk");
      } else {
        clip = animation.threeResource.animations.find((c) => c.name === "Run");
      }

      if (clip && animation.lastClip !== clip) {
        const action = animation.mixer.clipAction(clip);
        action.play();
        animation.lastClip = clip;
      }

      animation.mixer.update(ctx.dt);
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
