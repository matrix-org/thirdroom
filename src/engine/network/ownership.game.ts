import { addComponent, hasComponent } from "bitecs";

import { sliceCursorView, CursorView, writeUint32, readUint32, createCursorView } from "../allocator/CursorView";
import { NOOP } from "../config.common";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { RigidBody } from "../physics/physics.game";
import { getPrefabTemplate, Prefab } from "../prefab/prefab.game";
import { isHost } from "./network.common";
import { getRemoteResource } from "../resource/resource.game";
import { addObjectToWorld, RemoteNode, removeObjectFromWorld } from "../resource/RemoteResources";
import { GameNetworkState, NetworkModule } from "./network.game";
import { Networked, Owned } from "./NetworkComponents";
import { NetworkAction } from "./NetworkAction";
import { broadcastReliable } from "./outbound.game";
import { writeMetadata, NetPipeData } from "./serialization.game";

// const messageView = createCursorView(new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 3));
const messageView = createCursorView(new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 30));

export const createRemoveOwnershipMessage = (ctx: GameState, eid: number) => {
  writeMetadata(NetworkAction.RemoveOwnershipMessage)([ctx, messageView]);
  serializeRemoveOwnership(messageView, eid);
  return sliceCursorView(messageView);
};

export const serializeRemoveOwnership = (cv: CursorView, eid: number) => {
  writeUint32(cv, Networked.networkId[eid]);
};

export const deserializeRemoveOwnership = (input: NetPipeData) => {
  const [ctx, cv] = input;
  const network = getModule(ctx, NetworkModule);
  const nid = readUint32(cv);
  const eid = network.networkIdToEntityId.get(nid);
  const node = eid ? getRemoteResource<RemoteNode>(ctx, eid) : undefined;
  if (node) {
    removeObjectFromWorld(ctx, node);
  }
};

export const takeOwnership = (ctx: GameState, network: GameNetworkState, node: RemoteNode): number => {
  const eid = node.eid;
  if (network.authoritative && !isHost(network)) {
    // TODO: when Authored component is implemented, add Owned component here
  } else if (!hasComponent(ctx.world, Owned, eid)) {
    removeObjectFromWorld(ctx, node);

    // send message to remove on other side
    broadcastReliable(ctx, network, createRemoveOwnershipMessage(ctx, node.eid));

    const prefabName = Prefab.get(eid);
    if (!prefabName) throw new Error("could not take ownership, prefab name not found: " + prefabName);

    const template = getPrefabTemplate(ctx, prefabName);
    const newNode = template.create(ctx);

    addComponent(ctx.world, Owned, newNode.eid);
    addComponent(ctx.world, Networked, newNode.eid);

    const body = RigidBody.store.get(eid);
    if (!body) throw new Error("rigidbody not found for eid: " + eid);

    newNode.position.set(node.position);
    newNode.scale.set(node.scale);
    newNode.quaternion.set(node.quaternion);

    addObjectToWorld(ctx, newNode);

    return newNode.eid;
  }

  return NOOP;
};
