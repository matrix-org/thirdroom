import {
  createCursorView,
  readFloat32,
  readUint8,
  sliceCursorView,
  writeArrayBuffer,
  writeUint8,
} from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { applyMouseButtons, applyMouseMovement, applyMouseScroll } from "../input/input.game";
import { KeyCodes, Keys } from "../input/KeyCodes";
import { getModule } from "../module/module.common";
import { NetworkModule } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { NetPipeData, writeMetadata } from "./serialization.game";

const MESSAGE_SIZE = Uint8Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT;
const messageView = createCursorView(new ArrayBuffer(100 * MESSAGE_SIZE));

export const createCommandMessage = (ctx: GameState, commands: ArrayBuffer[]) => {
  writeMetadata(NetworkAction.Command)([ctx, messageView]);
  writeUint8(messageView, commands.length);
  for (const command of commands) {
    writeArrayBuffer(messageView, command);
  }
  return sliceCursorView(messageView);
};

const out: { keyCode: number; values: [number, number] } = { keyCode: 0, values: [0, 0] };
export const deserializeCommand = (input: NetPipeData) => {
  const [ctx, cv, peerId] = input;
  const network = getModule(ctx, NetworkModule);

  const count = readUint8(cv);
  for (let i = 0; i < count; i++) {
    out.keyCode = readUint8(cv);
    out.values[0] = readFloat32(cv);
    out.values[1] = readFloat32(cv);

    let raw = network.peerIdToInputState.get(peerId);

    if (!raw) {
      raw = {};
      network.peerIdToInputState.set(peerId, raw);
    }

    switch (out.keyCode) {
      case KeyCodes.MouseButtons:
        applyMouseButtons(raw, out);
        break;
      case KeyCodes.MouseMovement:
        applyMouseMovement(raw, out);
        break;
      case KeyCodes.MouseScroll:
        applyMouseScroll(raw, out);
        break;
      default:
        raw[`Keyboard/${Keys[out.keyCode]}`] = out.values[0];
    }

    return input;
  }
};
