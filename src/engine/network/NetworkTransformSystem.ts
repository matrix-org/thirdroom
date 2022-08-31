import { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import { defineQuery, enterQuery, exitQuery, Not } from "bitecs";
import { Vector3, Quaternion } from "three";
import { quat, vec3 } from "gl-matrix";

import { Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { RigidBody } from "../physics/physics.game";
import { GameNetworkState, getPeerIdIndexFromNetworkId, Networked, NetworkModule, Owned } from "./network.game";
import { getModule } from "../module/module.common";
import { addEntityToHistorian, getEntityHistory, removeEntityFromHistorian } from "./Historian";
import { addEntityHistory, syncWithHistorian } from "./InterpolationBuffer";
import { clamp } from "../utils/interpolation";

export const remoteEntityQuery = defineQuery([Networked, Not(Owned)]);
export const enteredRemoteEntityQuery = enterQuery(remoteEntityQuery);
export const exitedRemoteEntityQuery = exitQuery(remoteEntityQuery);

const getPeerIdFromEntityId = (network: GameNetworkState, eid: number) => {
  const pidx = getPeerIdIndexFromNetworkId(Networked.networkId[eid]);
  const peerId = network.indexToPeerId.get(pidx) || network.entityIdToPeerId.get(eid);
  return peerId;
};

const _vec = new Vector3();
const _quat = new Quaternion();

export function NetworkTransformSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  const entered = enteredRemoteEntityQuery(ctx.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const body = RigidBody.store.get(eid);
    if (body) {
      applyNetworkedToRigidBody(eid, body);

      // add to historian
      const pidx = getPeerIdIndexFromNetworkId(Networked.networkId[eid]);
      const peerId = network.indexToPeerId.get(pidx);
      if (!peerId) continue;
      const historian = network.peerIdToHistorian.get(peerId);
      if (!historian) continue;
      addEntityToHistorian(historian, eid);
    }
  }

  preprocessHistorians(ctx, network);

  // lerp rigidbody towards network transform for remote networked entities
  const entities = remoteEntityQuery(ctx.world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const body = RigidBody.store.get(eid);
    if (body) {
      const peerId = getPeerIdFromEntityId(network, eid);
      if (peerId === undefined) continue;

      const historian = network.peerIdToHistorian.get(peerId);
      if (historian === undefined) continue;

      const position = Transform.position[eid];
      const quaternion = Transform.quaternion[eid];
      const velocity = RigidBody.velocity[eid];

      const netPosition = Networked.position[eid];
      const netVelocity = Networked.velocity[eid];
      const netQuaternion = Networked.quaternion[eid];

      const history = getEntityHistory(historian, eid);

      if (historian.needsUpdate) {
        // append current network values to interpolation buffer
        addEntityHistory(history, netPosition, netVelocity, netQuaternion);
      }
      // drop old history
      syncWithHistorian(history, historian);

      const from = historian.fromIndex;
      const to = historian.toIndex;

      if (!from || !to) {
        continue;
      }

      const pFrom = history.position.at(from);
      const pTo = history.position.at(to);
      if (pFrom && pTo) {
        vec3.lerp(position, pFrom, pTo, historian.fractionOfTimePassed);
        body.setTranslation(_vec.fromArray(position), true);
      }

      const vFrom = history.velocity.at(from);
      const vTo = history.velocity.at(to);
      if (vFrom && vTo) {
        vec3.lerp(velocity, vFrom, vTo, historian.fractionOfTimePassed);
        body.setLinvel(_vec.fromArray(velocity), true);
      }

      // TODO: figure out why hermite interpolation snaps entity to 0,0 every so often
      // if (pFrom && pTo && vFrom && vTo) {
      //   vec3.lerp(velocity, vFrom, vTo, historian.fractionOfTimePassed);
      //   body.setLinvel(_vec.fromArray(velocity), true);

      //   vec3.hermite(position, pFrom, pTo, vFrom, vTo, historian.fractionOfTimePassed);
      //   body.setTranslation(_vec.fromArray(position), true);
      //   console.log(position[0], position[1], position[2]);
      // }

      const qFrom = history.quaternion.at(from);
      const qTo = history.quaternion.at(to);
      if (qFrom && qTo) {
        quat.slerp(quaternion, qFrom, qTo, historian.fractionOfTimePassed);
        body.setRotation(_quat.fromArray(quaternion), true);
      }
    }
  }

  const exited = exitedRemoteEntityQuery(ctx.world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    // remove from historian
    const pidx = getPeerIdIndexFromNetworkId(Networked.networkId[eid]);
    const peerId = network.indexToPeerId.get(pidx);
    if (!peerId) continue;
    const historian = network.peerIdToHistorian.get(peerId);
    if (!historian) continue;
    removeEntityFromHistorian(historian, eid);
  }

  postprocessHistorians(ctx, network);
}

function preprocessHistorians(ctx: GameState, network: GameNetworkState) {
  for (const [, historian] of network.peerIdToHistorian) {
    const targetElapsed = (historian.targetElapsed = historian.localElapsed - historian.interpolationBufferMs);

    if (historian.needsUpdate) {
      // add timestamp to historian
      historian.timestamps.unshift(historian.latestElapsed);
    }

    let fromTime = 0;
    let fromIndex;
    let toTime = 0;
    let toIndex;
    if (historian.timestamps.length > 2)
      for (let i = historian.timestamps.length - 2; i >= 0; --i) {
        toTime = historian.timestamps[i];
        fromTime = historian.timestamps[i + 1];
        if (toTime && fromTime && targetElapsed < toTime && targetElapsed > fromTime) {
          toIndex = i;
          fromIndex = i + 1;
          break;
        }
      }

    historian.timestamps.splice((fromIndex || 0) + 5);

    const ratio = (targetElapsed - fromTime) / (toTime - fromTime);

    historian.fractionOfTimePassed = clamp(-1, 1, ratio || 0.1);

    historian.toIndex = toIndex;
    historian.fromIndex = fromIndex;

    // step forward local elapsed
    historian.localElapsed += ctx.dt * 1000;
  }
}

function postprocessHistorians(ctx: GameState, network: GameNetworkState) {
  for (const [, historian] of network.peerIdToHistorian) {
    historian.needsUpdate = false;
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
