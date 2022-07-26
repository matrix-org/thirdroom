import { addComponent, defineQuery, IWorld, removeComponent } from "bitecs";
import { Animator, Armature, Clip, Pose } from "ossos";

import { Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { RigidBody } from "../physics/physics.game";

export interface IAnimationComponent {
  animator: Animator;
  clips: Clip[];
  armature: Armature;
  pose: Pose;
}

export const AnimationComponent = new Map<number, IAnimationComponent>();

const animationQuery = defineQuery([AnimationComponent]);
// const enterAnimationQuery = enterQuery(animationQuery);
// const exitAnimationQuery = exitQuery(animationQuery);

const idleThreshold = 0.5;
const walkThreshold = 10;

export function AnimationSystem(ctx: GameState) {
  // const entered = enterAnimationQuery(ctx.world);
  // for (let i = 0; i < entered.length; i++) {
  //   const eid = entered[i];
  // }

  const ents = animationQuery(ctx.world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const animation = AnimationComponent.get(eid);
    const rigidBody = RigidBody.store.get(Transform.parent[eid] || eid);
    if (animation && rigidBody) {
      const linvel = rigidBody.linvel();
      const len = linvel.x ** 2 + linvel.z ** 2;

      let speed = ctx.dt;

      if (linvel.y < -20) {
        const clip = animation.clips.find((c) => c.name === "Fall3");
        if (clip) animation.animator.setClip(clip);
        speed = (len / 40) * ctx.dt;
      } else if (Math.abs(linvel.y) > 0.2) {
        const clip = animation.clips.find((c) => c.name === "Fall1");
        if (clip) animation.animator.setClip(clip);
        speed = (len / 8) * ctx.dt;
      } else if (len < idleThreshold) {
        const clip = animation.clips.find((c) => c.name === "Idle");
        if (clip) animation.animator.setClip(clip);
      } else if (len < walkThreshold) {
        const clip = animation.clips.find((c) => c.name === "Walk");
        if (clip) animation.animator.setClip(clip);
        speed = (len / 4) * ctx.dt;
      } else {
        const clip = animation.clips.find((c) => c.name === "Run");
        if (clip) animation.animator.setClip(clip);
        speed = (len / 40) * ctx.dt;
      }

      animation.animator.update(speed);
      animation.animator.applyPose(animation.pose);
      animation.pose.updateWorld();
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
