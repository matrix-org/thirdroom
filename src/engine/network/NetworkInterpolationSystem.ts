import { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import { defineQuery, enterQuery, exitQuery, Not } from "bitecs";
import { Vector3, Quaternion } from "three";
import { quat, vec3 } from "gl-matrix";

import { Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { RigidBody } from "../physics/physics.game";
import { GameNetworkState, getPeerIndexFromNetworkId, Networked, NetworkModule, Owned } from "./network.game";
import { getModule } from "../module/module.common";
import {
  INTERP_BUFFER_MS,
  INTERP_AMOUNT_MS,
  addEntityToHistorian,
  getEntityHistory,
  removeEntityFromHistorian,
} from "./Historian";
import { addEntityHistory, syncWithHistorian } from "./InterpolationBuffer";
import { clamp } from "../utils/interpolation";
import { tickRate } from "../config.common";

const FRAME_MS = 1000 / tickRate;

export const remoteEntityQuery = defineQuery([Networked, Not(Owned)]);
export const enteredRemoteEntityQuery = enterQuery(remoteEntityQuery);
export const exitedRemoteEntityQuery = exitQuery(remoteEntityQuery);

const getPeerIdFromEntityId = (network: GameNetworkState, eid: number) => {
  const pidx = getPeerIndexFromNetworkId(Networked.networkId[eid]);
  const peerId = network.indexToPeerId.get(pidx) || network.entityIdToPeerId.get(eid);
  return peerId;
};

const _vec = new Vector3();
const _quat = new Quaternion();

export function NetworkInterpolationSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  const entered = enteredRemoteEntityQuery(ctx.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const body = RigidBody.store.get(eid);
    if (body) {
      applyNetworkedToRigidBody(eid, body);

      // add to historian
      const pidx = getPeerIndexFromNetworkId(Networked.networkId[eid]);
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

    if (!body) {
      console.warn("could not find rigidbody for:", eid);
      continue;
    }

    const peerId = getPeerIdFromEntityId(network, eid);
    if (peerId === undefined) {
      console.warn("could not find peerId for:", eid);
      continue;
    }

    const historian = network.peerIdToHistorian.get(peerId);
    if (historian === undefined) {
      applyNetworkedToRigidBody(eid, body);
      // console.warn("could not find historian for:", peerId);
      continue;
    }

    const position = Transform.position[eid];
    const quaternion = Transform.quaternion[eid];
    const velocity = RigidBody.velocity[eid];

    const netPosition = Networked.position[eid];
    const netVelocity = Networked.velocity[eid];
    const netQuaternion = Networked.quaternion[eid];

    if (!network.interpolate) {
      applyNetworkedToRigidBody(eid, body);
      continue;
    }

    const history = getEntityHistory(historian, eid);

    if (historian.needsUpdate) {
      // append current network values to interpolation buffer
      addEntityHistory(history, netPosition, netVelocity, netQuaternion);
    }

    // drop old history
    syncWithHistorian(history, historian);

    if (historian.index === -1) {
      continue;
    }

    // TODO: optional hermite interpolation

    const from = historian.index || 0;
    const to = (historian.index || 0) - 1;

    const pFrom = history.position.at(from);
    const pTo = history.position.at(to);
    if (pFrom && pTo) {
      vec3.lerp(position, pFrom, pTo, historian.fractionOfTimePassed);
      body.setTranslation(_vec.fromArray(position), true);
    }

    if (body.isDynamic()) {
      const vFrom = history.velocity.at(from);
      const vTo = history.velocity.at(to);
      if (vFrom && vTo) {
        vec3.lerp(velocity, vFrom, vTo, historian.fractionOfTimePassed);
        body.setLinvel(_vec.fromArray(velocity), true);
      }
    }

    const qFrom = history.quaternion.at(from);
    const qTo = history.quaternion.at(to);
    if (qFrom && qTo) {
      quat.slerp(quaternion, qFrom, qTo, historian.fractionOfTimePassed);
      body.setRotation(_quat.fromArray(quaternion), true);
    }
  }

  const exited = exitedRemoteEntityQuery(ctx.world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    // remove from historian
    const pidx = getPeerIndexFromNetworkId(Networked.networkId[eid]);
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
    if (historian.needsUpdate) {
      // add timestamp to historian
      historian.timestamps.unshift(historian.latestElapsed);
    }

    // step forward local elapsed
    historian.localElapsed += ctx.dt * 1000;

    const trimElapsed = historian.localElapsed - INTERP_BUFFER_MS;

    const targetElapsed = (historian.targetElapsed = historian.localElapsed - INTERP_AMOUNT_MS + FRAME_MS);

    let index = -1;
    if (historian.timestamps.length > 2) {
      for (let i = historian.timestamps.length - 1; i >= 0; i--) {
        const t = historian.timestamps[i];
        const tt = historian.timestamps[i - 1];

        if (t < trimElapsed) {
          historian.timestamps.splice(i);
          continue;
        }

        index = i;

        if (t < targetElapsed && tt > targetElapsed) {
          break;
        }
      }
      if (index === -1) {
        console.warn("interpolation buffer full");
        continue;
      }
    }

    historian.index = index;

    const fromTime = historian.timestamps.at(index) || 0;
    const toTime = historian.timestamps.at(index - 1) || 0;

    const ratio = (targetElapsed - fromTime) / (toTime - fromTime);

    historian.fractionOfTimePassed = clamp(-1, 1, ratio || 0.1);
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
  if (body.isDynamic()) body.setLinvel(_vec.fromArray(netVelocity), true);
  body.setRotation(_quat.fromArray(netQuaternion), true);
}
