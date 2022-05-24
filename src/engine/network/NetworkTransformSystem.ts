import { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import { defineQuery, Not } from "bitecs";
import { Vector3, Quaternion } from "three";

import { Transform } from "../component/transform";
import { GameState } from "../GameWorker";
import { RigidBody } from "../physics/physics.game";
import { Networked, NetworkTransform, Owned } from "./network.game";

export const remoteRigidBodyQuery = defineQuery([RigidBody, Networked, NetworkTransform, Not(Owned)]);

const applyNetworkTransformToRigidBodyAndTransform = (body: RapierRigidBody, eid: number) => {
  const netPosition = NetworkTransform.position[eid];
  const netQuaternion = NetworkTransform.quaternion[eid];

  Transform.position[eid].set(netPosition);
  Transform.quaternion[eid].set(netQuaternion);

  body.setTranslation(new Vector3().fromArray(netPosition), true);
  body.setRotation(new Quaternion().fromArray(netQuaternion), true);
};

export function NetworkTransformSystem({ world }: GameState) {
  // lerp rigidbody towards network transform for remote networked entities
  const remoteRigidBodyEntities = remoteRigidBodyQuery(world);
  for (let i = 0; i < remoteRigidBodyEntities.length; i++) {
    const eid = remoteRigidBodyEntities[i];
    const body = RigidBody.store.get(eid);
    if (body) {
      applyNetworkTransformToRigidBodyAndTransform(body, eid);
    }
  }
}
