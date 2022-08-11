import RAPIER from "@dimforge/rapier3d-compat";
import { defineComponent, defineQuery, enterQuery, exitQuery, addComponent, removeComponent } from "bitecs";
import { vec3, quat, mat4 } from "gl-matrix";
import { Quaternion, Vector3 } from "three";

import { Transform } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { getModule, Thread } from "../../engine/module/module.common";
import { PhysicsModule } from "../../engine/physics/physics.game";
import { ReticleFocusMessage } from "./reticle.common";

const FocusComponent = defineComponent();
const focusQuery = defineQuery([FocusComponent]);
const enterFocusQuery = enterQuery(focusQuery);
const exitFocusQuery = exitQuery(focusQuery);

const MAX_FOCUS_DISTANCE = 2;

const _target = vec3.create();
const _cameraWorldQuat = quat.create();

const shapeCastPosition = new Vector3();
const shapeCastRotation = new Quaternion();

const colliderShape = new RAPIER.Ball(0.7);

const collisionGroups = 0x00f0_000f;

const _s = new Vector3();
const _t = new Vector3();

export function ReticleFocusSystem(ctx: GameState) {
  const physics = getModule(ctx, PhysicsModule);

  // raycast outward from camera
  const cameraMatrix = Transform.worldMatrix[ctx.activeCamera];
  mat4.getRotation(_cameraWorldQuat, cameraMatrix);

  const target = vec3.set(_target, 0, 0, -1);
  vec3.transformQuat(target, target, _cameraWorldQuat);
  vec3.scale(target, target, MAX_FOCUS_DISTANCE);

  const source = mat4.getTranslation(vec3.create(), cameraMatrix);

  const s: Vector3 = _s.fromArray(source);
  const t: Vector3 = _t.fromArray(target);

  shapeCastPosition.copy(s);

  const hit = physics.physicsWorld.castShape(
    shapeCastPosition,
    shapeCastRotation,
    t,
    colliderShape,
    1.0,
    collisionGroups
  );

  if (hit !== null) {
    const eid = physics.handleToEid.get(hit.colliderHandle);
    if (!eid) {
      console.warn(`Could not find entity for physics handle ${hit.colliderHandle}`);
    } else {
      addComponent(ctx.world, FocusComponent, eid);
    }
  } else {
    // clear focus
    focusQuery(ctx.world).forEach((eid) => removeComponent(ctx.world, FocusComponent, eid));
  }

  const entered = enterFocusQuery(ctx.world);
  if (entered[0]) ctx.sendMessage(Thread.Main, { type: ReticleFocusMessage, focused: true });

  const exited = exitFocusQuery(ctx.world);
  if (exited[0]) ctx.sendMessage(Thread.Main, { type: ReticleFocusMessage, focused: false });
}
