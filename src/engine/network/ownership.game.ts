import { addComponent, hasComponent, removeEntity } from "bitecs";

import { sliceCursorView, CursorView, writeUint32, readUint32, createCursorView } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import {
  writeMessageType,
  Networked,
  NetPipeData,
  NetworkModule,
  NetworkAction,
  broadcastReliable,
  Owned,
} from "./network.game";

const messageView = createCursorView(new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 2));

export const createRemoveOwnershipMessage = (ctx: GameState, eid: number) => {
  writeMessageType(messageView, NetworkAction.RemoveOwnershipMessage);
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
    // hack - set nid to 0 to prevent removal of entity over the network
    Networked.networkId[eid] = 0;
    removeEntity(ctx.world, eid);
  }
};

export const takeOwnership = (ctx: GameState, eid: number) => {
  if (!hasComponent(ctx.world, Owned, eid)) {
    addComponent(ctx.world, Owned, eid);
    // send message to remove on other side
    broadcastReliable(ctx, createRemoveOwnershipMessage(ctx, eid));
  }
};
