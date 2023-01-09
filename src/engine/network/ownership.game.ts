import { addComponent, hasComponent } from "bitecs";

import { sliceCursorView, CursorView, writeUint32, readUint32, createCursorView } from "../allocator/CursorView";
import { NOOP } from "../config.common";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { RigidBody } from "../physics/physics.game";
import { getPrefabTemplate, Prefab } from "../prefab/prefab.game";
import { isHost } from "./network.common";
import {
  addObjectToWorld,
  createRemoteObject,
  getRemoteResource,
  RemoteNode,
  removeObjectFromWorld,
} from "../resource/resource.game";
import { GameNetworkState, Networked, NetworkModule, Owned } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { broadcastReliable } from "./outbound.game";
import { writeMetadata, NetPipeData } from "./serialization.game";

const messageView = createCursorView(new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 3));

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
    removeObjectFromWorld(ctx.worldResource, node);
  }
};

export const takeOwnership = (ctx: GameState, network: GameNetworkState, node: RemoteNode): number => {
  const eid = node.eid;
  if (network.authoritative && !isHost(network)) {
    // TODO: when Authored component is implemented, add Owned component here
  } else if (!hasComponent(ctx.world, Owned, eid)) {
    removeObjectFromWorld(ctx.worldResource, node);

    const prefabName = Prefab.get(eid);
    if (!prefabName) throw new Error("could not take ownership, prefab name not found: " + prefabName);

    const template = getPrefabTemplate(ctx, prefabName);
    const newNode = template.create(ctx);

    const body = RigidBody.store.get(eid);
    if (!body) throw new Error("rigidbody not found for eid: " + eid);

    newNode.position.set(node.position);
    newNode.scale.set(node.scale);
    newNode.quaternion.set(node.quaternion);

    const obj = createRemoteObject(ctx, newNode);
    addComponent(ctx.world, Owned, obj.eid);
    addComponent(ctx.world, Networked, obj.eid);
    addObjectToWorld(ctx.worldResource, obj);

    // send message to remove on other side
    broadcastReliable(ctx, network, createRemoveOwnershipMessage(ctx, obj.eid));

    return obj.eid;
  }

  return NOOP;
};
