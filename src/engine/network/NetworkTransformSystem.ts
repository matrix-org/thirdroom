import { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import { defineQuery, enterQuery, Not } from "bitecs";
import { Vector3, Quaternion } from "three";

import { Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { RigidBody } from "../physics/physics.game";
import { Networked, Owned } from "./network.game";

export const remoteRigidBodyQuery = defineQuery([RigidBody, Networked, Not(Owned)]);
export const enteredRemotePlayerQuery = enterQuery(remoteRigidBodyQuery);

const _vec = new Vector3();
const _quat = new Quaternion();

export function NetworkTransformSystem({ world }: GameState) {
  const entered = enteredRemotePlayerQuery(world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const body = RigidBody.store.get(eid);
    if (body) {
      applyNetworkedToRigidBody(eid, body);
    }
  }

  // lerp rigidbody towards network transform for remote networked entities
  const entities = remoteRigidBodyQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const body = RigidBody.store.get(eid);
    if (body) {
      applyNetworkedToRigidBody(eid, body);
    }
  }
}

function applyNetworkedToRigidBody(eid: number, body: RapierRigidBody) {
  const netPosition = Networked.position[eid];
  const netQuaternion = Networked.quaternion[eid];
  const netVelocity = Networked.velocity[eid];

  Transform.position[eid].set(netPosition);
  Transform.quaternion[eid].set(netQuaternion);

  body.setTranslation(_vec.fromArray(netPosition), true);
  body.setLinvel(_vec.fromArray(netVelocity), true);
  body.setRotation(_quat.fromArray(netQuaternion), true);
}
