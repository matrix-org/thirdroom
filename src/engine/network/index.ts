import {
  addComponent,
  addEntity,
  defineComponent,
  defineQuery,
  enterQuery,
  exitQuery,
  Not,
  pipe,
  removeEntity,
  Types,
} from "bitecs";

import {
  createCursorView,
  CursorView,
  readFloat32,
  readUint32,
  readUint8,
  rewindCursorView,
  sliceCursorView,
  spaceUint32,
  spaceUint8,
  writeFloat32,
  writePropIfChanged,
  writeUint32,
  writeUint8,
} from "./CursorView";
import { addTransformComponent, Transform } from "../component/transform";
import { GameState } from "../GameWorker";

export enum NetworkMessage {
  Update = 0,
  Create = 1,
  Delete = 2,
  Full = 3,
  Snapshot = 4,
}

/* Utils */

const isolateBits = (val: number, n: number, offset = 0) => val & (((1 << n) - 1) << offset);

export const getClientIdFromNetworkId = (nid: number) => isolateBits(nid, 16);
export const getLocalIdFromNetworkId = (nid: number) => isolateBits(nid >>> 16, 16);

export const createNetworkId = (state: GameState) => {
  const { network } = state;
  const localId = state.network.removedLocalIds.shift() || network.localIdCount++;
  // bitwise operations in JS are limited to 32 bit integers (https://developer.mozilla.org/en-US/docs/web/javascript/reference/operators#binary_bitwise_operators)
  // logical right shift by 0 to treat as an unsigned integer
  const nid = ((localId << 16) | network.clientId) >>> 0;
  return nid;
};

/* Components */

export const Networked = defineComponent({
  networkId: Types.ui32,
  ownerId: Types.ui32,
});

export const Mine = defineComponent();

/* Queries */

export const localNetworkedQuery = defineQuery([Networked, Mine]);
export const createdNetworkedQuery = enterQuery(localNetworkedQuery);
export const deletedNetworkedQuery = exitQuery(localNetworkedQuery);
// eslint-disable-next-line new-cap
export const remoteNetworkedQuery = defineQuery([Networked, Not(Mine)]);

/* Transform serialization */

export const serializeTransformSnapshot = (v: CursorView, eid: number) => {
  const position = Transform.position[eid];
  writeFloat32(v, position[0]);
  writeFloat32(v, position[1]);
  writeFloat32(v, position[2]);

  const rotation = Transform.rotation[eid];
  writeFloat32(v, rotation[0]);
  writeFloat32(v, rotation[1]);
  writeFloat32(v, rotation[2]);

  return v;
};

export const deserializeTransformSnapshot = (v: CursorView, eid: number) => {
  const position = Transform.position[eid];
  position[0] = readFloat32(v);
  position[1] = readFloat32(v);
  position[2] = readFloat32(v);

  const rotation = Transform.rotation[eid];
  rotation[0] = readFloat32(v);
  rotation[1] = readFloat32(v);
  rotation[2] = readFloat32(v);

  return v;
};

export const serializeTransformChanged = (v: CursorView, eid: number) => {
  const writeChangeMask = spaceUint8(v);
  let changeMask = 0;
  let b = 0;

  const position = Transform.position[eid];
  changeMask |= writePropIfChanged(v, position, 0) ? 1 << b++ : b++ && 0;
  changeMask |= writePropIfChanged(v, position, 1) ? 1 << b++ : b++ && 0;
  changeMask |= writePropIfChanged(v, position, 2) ? 1 << b++ : b++ && 0;

  const rotation = Transform.rotation[eid];
  changeMask |= writePropIfChanged(v, rotation, 0) ? 1 << b++ : b++ && 0;
  changeMask |= writePropIfChanged(v, rotation, 1) ? 1 << b++ : b++ && 0;
  changeMask |= writePropIfChanged(v, rotation, 2) ? 1 << b++ : b++ && 0;

  writeChangeMask(changeMask);

  return changeMask > 0;
};

const checkBitflag = (mask: number, flag: number) => (mask & flag) === flag;

export const deserializeTransformChanged = (v: CursorView, eid: number) => {
  const changeMask = readUint8(v);
  let b = 0;

  const position = Transform.position[eid];
  if (checkBitflag(changeMask, 1 << b++)) position[0] = readFloat32(v);
  if (checkBitflag(changeMask, 1 << b++)) position[1] = readFloat32(v);
  if (checkBitflag(changeMask, 1 << b++)) position[2] = readFloat32(v);

  const rotation = Transform.rotation[eid];
  if (checkBitflag(changeMask, 1 << b++)) rotation[0] = readFloat32(v);
  if (checkBitflag(changeMask, 1 << b++)) rotation[1] = readFloat32(v);
  if (checkBitflag(changeMask, 1 << b++)) rotation[2] = readFloat32(v);

  return v;
};

/* Snapshot */

export function markSnapshotMessage(input: [GameState, CursorView]) {
  const [_, v] = input;
  writeUint8(v, NetworkMessage.Snapshot);
  return input;
}

/* Full */

export function markFullMessage(input: [GameState, CursorView]) {
  const [_, v] = input;
  writeUint8(v, NetworkMessage.Full);
  return input;
}

/* Create */

export function markCreateMessage(input: [GameState, CursorView]) {
  const [_, v] = input;
  writeUint8(v, NetworkMessage.Create);
  return input;
}

export function serializeCreatesSnapshot(input: [GameState, CursorView]) {
  const [state, v] = input;
  const entities = localNetworkedQuery(state.world);
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    writeUint32(v, nid);
  }
  return input;
}

export function serializeCreates(input: [GameState, CursorView]) {
  const [state, v] = input;
  const entities = createdNetworkedQuery(state.world);
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    writeUint32(v, nid);
  }
  return input;
}

export function createRemoteNetworkedEntity(input: [GameState, CursorView]) {
  const [state, v] = input;
  const nid = readUint32(v);
  const eid = addEntity(state.world);
  addTransformComponent(state.world, eid);
  addComponent(state.world, Networked, eid);
  Networked.networkId[eid] = nid;
  state.network.idMap.set(nid, eid);
  return input;
}

export function deserializeCreates(input: [GameState, CursorView]) {
  // const [_, v] = input;
  const v = input[1];
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    createRemoteNetworkedEntity(input);
  }
  return input;
}

/* Update */

function markUpdateMessage(input: [GameState, CursorView]) {
  const [_, v] = input;
  writeUint8(v, NetworkMessage.Update);
  return input;
}

export function serializeUpdatesSnapshot(input: [GameState, CursorView]) {
  const [state, v] = input;
  const entities = localNetworkedQuery(state.world);
  const writeCount = spaceUint32(v);
  let count = 0;
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    const writeNid = spaceUint32(v);
    serializeTransformSnapshot(v, eid);
    writeNid(nid);
    count += 1;
  }
  writeCount(count);
  return input;
}

export function serializeUpdatesChanged(input: [GameState, CursorView]) {
  const [state, v] = input;
  const entities = localNetworkedQuery(state.world);
  const writeCount = spaceUint32(v);
  let count = 0;
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const nid = Networked.networkId[eid];
    const rewind = rewindCursorView(v);
    const writeNid = spaceUint32(v);
    const written = serializeTransformChanged(v, eid);
    if (written) {
      writeNid(nid);
      count += 1;
    } else {
      rewind();
    }
  }
  writeCount(count);
  return input;
}

export function deserializeUpdatesSnapshot(input: [GameState, CursorView]) {
  const [state, v] = input;
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = state.network.idMap.get(nid);
    if (!eid) {
      console.warn(`could not deserialize update for non-existent entity ${eid}`);
      continue;
      // createIncomingNetworkedEntity(input);
    }
    deserializeTransformSnapshot(v, eid);
  }
  return input;
}

export function deserializeUpdatesChanged(input: [GameState, CursorView]) {
  const [state, v] = input;
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = state.network.idMap.get(nid);
    if (!eid) {
      console.warn(`could not deserialize update for non-existent entity ${eid}`);
      continue;
      // createIncomingNetworkedEntity(input);
    }
    deserializeTransformChanged(v, eid);
  }
  return input;
}

/* Delete */

function markDeleteMessage(input: [GameState, CursorView]) {
  const [_, v] = input;
  writeUint8(v, NetworkMessage.Delete);
  return input;
}

export function serializeDeletes(input: [GameState, CursorView]) {
  const [state, v] = input;
  const entities = deletedNetworkedQuery(state.world);
  writeUint32(v, entities.length);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    writeUint32(v, eid);
  }
  return input;
}

export function deserializeDeletes(input: [GameState, CursorView]) {
  const [state, v] = input;
  const count = readUint32(v);
  for (let i = 0; i < count; i++) {
    const nid = readUint32(v);
    const eid = state.network.idMap.get(nid);
    if (!eid) {
      console.warn(`could not remove networkId ${nid}, no matching entity`);
    } else {
      removeEntity(state.world, eid);
      state.network.idMap.delete(nid);
    }
  }
  return input;
}

/* Outgoing */

export const createSnapshotMessage: (input: [GameState, CursorView]) => ArrayBuffer = pipe(
  markSnapshotMessage,
  serializeCreatesSnapshot,
  serializeUpdatesSnapshot,
  ([_, v]) => sliceCursorView(v)
);

export const createFullMessage: (input: [GameState, CursorView]) => ArrayBuffer = pipe(
  markFullMessage,
  serializeCreates,
  serializeUpdatesChanged,
  serializeDeletes,
  ([_, v]) => sliceCursorView(v)
);

export const createCreateMessage: (input: [GameState, CursorView]) => ArrayBuffer = pipe(
  markCreateMessage,
  serializeCreates,
  ([_, v]) => sliceCursorView(v)
);

export const createChangedUpdateMessage: (input: [GameState, CursorView]) => ArrayBuffer = pipe(
  markUpdateMessage,
  serializeUpdatesChanged,
  ([_, v]) => sliceCursorView(v)
);

export const createDeleteMessage: (input: [GameState, CursorView]) => ArrayBuffer = pipe(
  markDeleteMessage,
  serializeDeletes,
  ([_, v]) => sliceCursorView(v)
);

const broadcast = (state: GameState, packet: ArrayBuffer) => {
  throw new Error("Function not implemented.");
};

export function IncomingNetworkSystem(state: GameState) {
  const cursorView = createCursorView();
  const input: [GameState, CursorView] = [state, cursorView];
  return function (state: GameState) {
    // todo: send snapshot for newly seen clients

    const msg = createFullMessage(input);
    broadcast(state, msg);
  };
}

/* Incoming */

const deserializeSnapshot = pipe(deserializeCreates, deserializeUpdatesSnapshot);
const deserializeFullUpdate = pipe(deserializeCreates, deserializeUpdatesChanged, deserializeDeletes);

const processNetworkMessage = (state: GameState, msg: ArrayBuffer) => {
  const cursorView = createCursorView(msg);
  const messageType = readUint8(cursorView);
  const input: [GameState, CursorView] = [state, cursorView];
  switch (messageType) {
    case NetworkMessage.Create:
      deserializeCreates(input);
      break;
    case NetworkMessage.Update:
      deserializeUpdatesChanged(input);
      break;
    case NetworkMessage.Delete:
      deserializeDeletes(input);
      break;
    case NetworkMessage.Snapshot:
      deserializeSnapshot(input);
      break;
    case NetworkMessage.Full:
      deserializeFullUpdate(input);
      break;
  }
};

const processNetworkMessages = (state: GameState) => {
  while (state.network.messages.length) {
    const msg = state.network.messages.pop();
    if (msg) processNetworkMessage(state, msg);
  }
};

export function OutgoingNetworkSystem() {
  // todo: network message middleware API
  // registerNetworkMessage(NetworkMessage.Create, deserializeCreates);
  // registerNetworkMessage(NetworkMessage.Update, deserializeUpdates);
  // registerNetworkMessage(NetworkMessage.Delete, deserializeDeletes);
  // registerNetworkMessage(NetworkMessage.Snapshot, deserializeSnapshot);
  // registerNetworkMessage(NetworkMessage.Full, deserializeFullUpdate);

  return function (state: GameState) {
    processNetworkMessages(state);
  };
}
