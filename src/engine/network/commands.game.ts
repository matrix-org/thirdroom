import {
  createCursorView,
  readArrayBuffer,
  readUint16,
  readUint8,
  sliceCursorView,
  writeArrayBuffer,
  writeUint16,
  writeUint8,
} from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { ActionTypesToBindings } from "../input/ActionMappingSystem";
import { InputModule } from "../input/input.game";
import { getInputController } from "../input/InputController";
import { getModule } from "../module/module.common";
import { NetworkModule } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { NetPipeData, writeMetadata } from "./serialization.game";

const MAX_MESSAGES = 1000;
const MESSAGE_SIZE =
  2 * Uint8Array.BYTES_PER_ELEMENT + Uint16Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT * 10;

const writeView = createCursorView(new ArrayBuffer(MAX_MESSAGES * MESSAGE_SIZE));

export const createCommandsMessage = (ctx: GameState, actions: [number, number, ArrayBuffer][]) => {
  writeMetadata(NetworkAction.Command)([ctx, writeView]);
  writeUint8(writeView, actions.length);
  for (let i = 0; i < actions.length; i++) {
    const [, actionId, buffer] = actions[i];
    writeUint8(writeView, actionId);
    writeUint16(writeView, buffer.byteLength);
    writeArrayBuffer(writeView, buffer);
  }
  return sliceCursorView(writeView);
};

export const deserializeCommands = (data: NetPipeData) => {
  const [ctx, readView, peerId] = data;
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);

  const eid = network.peerIdToEntityId.get(peerId);

  if (!eid) {
    return data;
  }

  const controller = getInputController(input, eid);

  if (!controller) {
    console.warn("could not deserialize commands for peerId", peerId, ", controller not found");
    return data;
  }

  const count = readUint8(readView);
  for (let i = 0; i < count; i++) {
    const id = readUint8(readView);
    const byteLength = readUint16(readView);
    const encodedAction = readArrayBuffer(readView, byteLength);

    const path = controller.idToPath.get(id)!;
    const actionDef = controller.pathToDef.get(path)!;
    const action = ActionTypesToBindings[actionDef.type];
    const decodedAction = action.decode(encodedAction);
    controller.actionStates.set(path, decodedAction);
  }

  return data;
};
