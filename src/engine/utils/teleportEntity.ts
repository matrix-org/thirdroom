import { vec3, quat } from "gl-matrix";
import { Vector3, Quaternion } from "three";

import { skipRenderLerp } from "../component/transform";
import { GameState } from "../GameTypes";
import { RemoteNodeComponent } from "../node/node.game";
import { RigidBody } from "../physics/physics.game";

const zero = new Vector3();
const tmpVec = new Vector3();
const tmpQuat = new Quaternion();

export function teleportEntity(ctx: GameState, eid: number, position: vec3, quaternion?: quat) {
  // mark to skip lerp to ensure lerp is fully avoided (if render tick is running up to 5x faster than game tick)
  skipRenderLerp(ctx, eid);
  const node = RemoteNodeComponent.get(eid)!;
  node.position.set(position);
  if (quaternion) {
    node.quaternion.set(quaternion);
  }
  const body = RigidBody.store.get(eid);
  if (body) {
    const position = node.position;
    body.setTranslation(tmpVec.fromArray(position), true);
    if (quaternion) body.setRotation(tmpQuat.fromArray(quaternion), true);

    body.setLinvel(zero, true);
    body.setAngvel(zero, true);
  }
}
