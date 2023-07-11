import { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import { defineQuery, enterQuery, exitQuery, Not } from "bitecs";
import { Vector3, Quaternion } from "three";
import { quat, vec3 } from "gl-matrix";

import { GameContext } from "../GameTypes";
import { GameNetworkState, getPeerInfoById, NetworkModule, ownedPlayerQuery, tryGetPeerInfoById } from "./network.game";
import { Networked, Authoring } from "./NetworkComponents";
import { getModule } from "../module/module.common";
import {
  INTERP_BUFFER_MS,
  INTERP_AMOUNT_MS,
  addEntityToHistorian,
  getEntityHistory,
  removeEntityFromHistorian,
} from "./Historian";
import { addEntityHistory, syncWithHistorian } from "./InterpolationBuffer";
import { getRemoteResource } from "../resource/resource.game";
import { RemoteNode } from "../resource/RemoteResources";
import { OurPlayer } from "../player/Player";
import { clamp } from "../common/math";

export const remoteEntityQuery = defineQuery([Networked, Not(Authoring), Not(OurPlayer)]);

export const enteredRemoteEntityQuery = enterQuery(remoteEntityQuery);
export const exitedRemoteEntityQuery = exitQuery(remoteEntityQuery);

const _vec = new Vector3();
const _quat = new Quaternion();

const _v3 = vec3.create();
const _q = quat.create();

export function NetworkInterpolationSystem(ctx: GameContext) {
  const network = getModule(ctx, NetworkModule);

  const haveConnectedPeers = network.peers.length > 0;
  const spawnedPlayerRig = ownedPlayerQuery(ctx.world).length > 0;

  if (!haveConnectedPeers || !spawnedPlayerRig) {
    return;
  }

  const entered = enteredRemoteEntityQuery(ctx.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const node = getRemoteResource<RemoteNode>(ctx, eid);
    const body = node?.physicsBody?.body;

    if (node) {
      applyNetworkedToEntity(node, body);

      // add to historian
      const pid = BigInt(Networked.authorId[eid]);

      getPeerInfoById;

      const peerInfo = tryGetPeerInfoById(network, pid);
      const historian = peerInfo.historian;
      if (!historian) {
        // throw new Error("historian not found for peer " + peerId);
        console.warn("historian not found for peer " + peerInfo.key);
        continue;
      }
      addEntityToHistorian(historian, eid);
    }
  }

  preprocessHistorians(ctx, network);

  // lerp rigidbody towards network transform for remote networked entities
  const entities = remoteEntityQuery(ctx.world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const node = getRemoteResource<RemoteNode>(ctx, eid);

    if (!node) {
      console.warn("could not find node for:", eid);
      continue;
    }

    const body = node.physicsBody?.body;

    if (!network.interpolate) {
      applyNetworkedToEntity(node, body);
      continue;
    }

    const peerInfo = tryGetPeerInfoById(network, BigInt(Networked.authorId[eid]));

    const historian = peerInfo.historian;
    if (historian === undefined) {
      console.warn("could not find historian for:", peerInfo.key);
      applyNetworkedToEntity(node, body);
      continue;
    }

    const position = node.position;
    const quaternion = node.quaternion;
    const velocity = node.physicsBody!.velocity;

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

    if (historian.index === -1) {
      continue;
    }

    // TODO: optional hermite interpolation

    const from = historian.index || 0;
    const to = (historian.index || 0) - 1;

    const pFrom = history.position.at(from);
    const pTo = history.position.at(to);
    if (pFrom && pTo) {
      vec3.lerp(_v3, pFrom, pTo, historian.fractionOfTimePassed);
      if (body) body.setTranslation(_vec.fromArray(_v3), true);
      else vec3.copy(position, _v3);
    }

    const vFrom = history.velocity.at(from);
    const vTo = history.velocity.at(to);
    if (vFrom && vTo) {
      vec3.lerp(_v3, vFrom, vTo, historian.fractionOfTimePassed);
      if (body && body.isDynamic()) body.setLinvel(_vec.fromArray(_v3), true);
      else vec3.copy(velocity, _v3);
    }

    const qFrom = history.quaternion.at(from);
    const qTo = history.quaternion.at(to);
    if (qFrom && qTo) {
      quat.slerp(_q, qFrom, qTo, historian.fractionOfTimePassed);
      if (body) body.setRotation(_quat.fromArray(_q), true);
      else quat.copy(quaternion, _q);
    }
  }

  const exited = exitedRemoteEntityQuery(ctx.world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    // remove from historian
    const pid = BigInt(Networked.authorId[eid]);
    const peerInfo = tryGetPeerInfoById(network, pid);
    const historian = peerInfo.historian;
    if (!historian) continue;
    removeEntityFromHistorian(historian, eid);
  }

  postprocessHistorians(ctx, network);
}

function preprocessHistorians(ctx: GameContext, network: GameNetworkState) {
  for (const { historian } of network.peers) {
    if (!historian) {
      continue;
    }

    if (historian.needsUpdate) {
      historian.latency = Date.now() - historian.latestTime;
      // add timestamp to historian
      historian.timestamps.unshift(historian.latestTime);
    }

    const trimTime = historian.localTime - INTERP_BUFFER_MS;

    const targetTime = (historian.targetTime = historian.localTime - INTERP_AMOUNT_MS);

    // step forward local time
    historian.localTime += ctx.dt * 1000;

    let index = -1;
    if (historian.timestamps.length > 2) {
      for (let i = historian.timestamps.length - 1; i >= 0; i--) {
        const t = historian.timestamps[i];
        const tt = historian.timestamps[i - 1];

        if (t < trimTime) {
          historian.timestamps.splice(i);
          continue;
        }

        index = i;

        if (t < targetTime && tt > targetTime) {
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

    const ratio = (targetTime - fromTime) / (toTime - fromTime);

    historian.fractionOfTimePassed = clamp(ratio, 0, 1);
  }
}

function postprocessHistorians(ctx: GameContext, network: GameNetworkState) {
  for (const { historian } of network.peers) {
    if (!historian) {
      continue;
    }
    historian.needsUpdate = false;
  }
}

export function applyNetworkedToEntity(node: RemoteNode, body?: RapierRigidBody) {
  const eid = node.eid;
  const netPosition = Networked.position[eid];
  const netQuaternion = Networked.quaternion[eid];
  const netVelocity = Networked.velocity[eid];

  node.position.set(netPosition);
  node.quaternion.set(netQuaternion);

  if (node.physicsBody && body) {
    body.setTranslation(_vec.fromArray(netPosition), true);
    if (body.isDynamic()) body.setLinvel(_vec.fromArray(netVelocity), true);
    node.physicsBody.velocity.set(netVelocity);
    body.setRotation(_quat.fromArray(netQuaternion), true);
  }
}
