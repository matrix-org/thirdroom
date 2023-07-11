import { addComponent, hasComponent } from "bitecs";

import { sliceCursorView, CursorView, createCursorView, readUint64, writeUint64 } from "../allocator/CursorView";
import { NOOP } from "../config.common";
import { GameContext } from "../GameTypes";
import { getModule } from "../module/module.common";
import { getPrefabTemplate, Prefab } from "../prefab/prefab.game";
import { getRemoteResource } from "../resource/resource.game";
import { addObjectToWorld, RemoteNode, removeObjectFromWorld } from "../resource/RemoteResources";
import { GameNetworkState, NetworkModule } from "./network.game";
import { Networked, Authoring } from "./NetworkComponents";
import { NetworkMessage } from "./NetworkMessage";
import { writeMessageType } from "./serialization.game";
import { applyTransformToRigidBody } from "../physics/physics.game";
import { enqueueReliableBroadcast } from "./NetworkRingBuffer";

// const messageView = createCursorView(new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 3));
const messageView = createCursorView(new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 30));

export const createRemoveOwnershipMessage = (ctx: GameContext, eid: number) => {
  writeMessageType(messageView, NetworkMessage.RemoveOwnershipMessage);
  serializeRemoveOwnership(messageView, eid);
  return sliceCursorView(messageView);
};

export const serializeRemoveOwnership = (cv: CursorView, eid: number) => {
  writeUint64(cv, BigInt(Networked.networkId[eid]));
};

export const deserializeRemoveOwnership = (ctx: GameContext, cv: CursorView) => {
  const network = getModule(ctx, NetworkModule);
  const nid = readUint64(cv);
  const eid = network.networkIdToEntityId.get(nid);
  const node = eid ? getRemoteResource<RemoteNode>(ctx, eid) : undefined;
  if (node) {
    removeObjectFromWorld(ctx, node);
  }
};

export const takeOwnership = (ctx: GameContext, network: GameNetworkState, oldNode: RemoteNode): number => {
  const eid = oldNode.eid;
  if (
    hasComponent(ctx.world, Prefab, eid) &&
    hasComponent(ctx.world, Networked, eid) &&
    !hasComponent(ctx.world, Authoring, eid)
  ) {
    removeObjectFromWorld(ctx, oldNode);

    // send message to remove on other side
    enqueueReliableBroadcast(network, createRemoveOwnershipMessage(ctx, oldNode.eid));

    const prefabName = Prefab.get(eid);
    if (!prefabName) throw new Error("could not take ownership, prefab name not found: " + prefabName);

    const template = getPrefabTemplate(ctx, prefabName);
    const newNode = template.create(ctx);

    addComponent(ctx.world, Authoring, newNode.eid);
    addComponent(ctx.world, Networked, newNode.eid);

    const body = newNode.physicsBody?.body;
    if (!body) throw new Error("Physics body not found for eid: " + eid);

    newNode.position.set(oldNode.position);
    newNode.scale.set(oldNode.scale);
    newNode.quaternion.set(oldNode.quaternion);
    newNode.skipLerp = 10;

    applyTransformToRigidBody(body, newNode);

    addObjectToWorld(ctx, newNode);

    return newNode.eid;
  }

  return NOOP;
};
