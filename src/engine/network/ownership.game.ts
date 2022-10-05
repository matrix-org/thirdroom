import { addComponent, hasComponent } from "bitecs";

import { sliceCursorView, CursorView, writeUint32, readUint32, createCursorView } from "../allocator/CursorView";
import { addChild, removeRecursive, Transform } from "../component/transform";
import { NOOP } from "../config.common";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { RigidBody } from "../physics/physics.game";
import { getPrefabTemplate, Prefab } from "../prefab/prefab.game";
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
  if (eid) {
    removeRecursive(ctx.world, eid);
  }
};

export const takeOwnership = (ctx: GameState, network: GameNetworkState, eid: number): number => {
  if (!hasComponent(ctx.world, Owned, eid)) {
    removeRecursive(ctx.world, eid);

    const prefabName = Prefab.get(eid);
    if (!prefabName) throw new Error("could not take ownership, prefab name not found: " + prefabName);

    const newEid = getPrefabTemplate(ctx, prefabName).create(ctx);

    const body = RigidBody.store.get(eid);
    if (!body) throw new Error("rigidbody not found for eid: " + eid);

    Transform.position[newEid].set(Transform.position[eid]);
    Transform.scale[newEid].set(Transform.scale[eid]);
    Transform.rotation[newEid].set(Transform.rotation[eid]);
    Transform.quaternion[newEid].set(Transform.quaternion[eid]);

    addComponent(ctx.world, Owned, newEid);
    addComponent(ctx.world, Networked, newEid);

    addChild(ctx.activeScene, newEid);

    // send message to remove on other side
    broadcastReliable(ctx, network, createRemoveOwnershipMessage(ctx, eid));

    return newEid;
  }

  return NOOP;
};
