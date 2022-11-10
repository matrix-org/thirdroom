import { vec3, quat } from "gl-matrix";
import { Vector3, Quaternion } from "three";

import { setEulerFromQuaternion, skipRenderLerp, Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { RigidBody } from "../physics/physics.game";

const zero = new Vector3();
const tmpVec = new Vector3();
const tmpQuat = new Quaternion();

export function teleportEntity(ctx: GameState, eid: number, position: vec3, quaternion?: quat) {
  // mark to skip lerp to ensure lerp is fully avoided (if render tick is running up to 5x faster than game tick)
  skipRenderLerp(ctx, eid);

  Transform.position[eid].set(position);
  if (quaternion) {
    Transform.quaternion[eid].set(quaternion);
    setEulerFromQuaternion(Transform.rotation[eid], Transform.quaternion[eid]);
  }
  const body = RigidBody.store.get(eid);
  if (body) {
    const position = Transform.position[eid];
    body.setTranslation(tmpVec.fromArray(position), true);
    if (quaternion) body.setRotation(tmpQuat.fromArray(quaternion), true);

    body.setLinvel(zero, true);
    body.setAngvel(zero, true);
  }
}
