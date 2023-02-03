import {
  createCursorView,
  CursorView,
  moveCursorView,
  readUint32,
  writeInt32,
  writeUint32,
} from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { ScriptResourceManager } from "../resource/ScriptResourceManager";
import { decodeString } from "../resource/strings";
import { createDisposables } from "../utils/createDisposables";
import { MatrixAPIMessageType, MatrixToWidgetMessage } from "./matrix.common";

interface MatrixModuleState {
  toWidgetMessages: MatrixToWidgetMessage[];
}

export const MatrixModule = defineModule<GameState, MatrixModuleState>({
  name: "matrix",
  create: () => {
    return {
      toWidgetMessages: [],
    };
  },
  init(ctx: GameState) {
    return createDisposables([registerMessageHandler(ctx, MatrixAPIMessageType.ToWidget, onToWidgetMessage)]);
  },
});

function onToWidgetMessage(ctx: GameState, message: MatrixToWidgetMessage) {
  const { toWidgetMessages } = getModule(ctx, MatrixModule);
  toWidgetMessages.push(message);
}

export const WASMMatrixNamespace = "matrix";

export function createMatrixWASMModule(ctx: GameState, resourceManager: ScriptResourceManager) {
  const { toWidgetMessages } = getModule(ctx, MatrixModule);
  const { memory, U8Heap } = resourceManager;
  const cursorView = createCursorView(memory.buffer);

  const readCString = (v: CursorView) => {
    const ptr = readUint32(v);
    return decodeString(ptr, U8Heap);
  };

  const writeCString = (v: CursorView, value: string) => {
    const ptr = resourceManager.writeString(value);
    writeUint32(v, ptr);
  };

  return {
    send: (requestPtr: number) => {
      moveCursorView(cursorView, requestPtr);
      const api = readCString(cursorView);
      const requestId = readCString(cursorView);
      const action = readCString(cursorView);
      const widgetId = readCString(cursorView);
      const dataStr = readCString(cursorView);
      const data = JSON.parse(dataStr);

      ctx.sendMessage(Thread.Main, {
        type: MatrixAPIMessageType.FromWidget,
        api,
        requestId,
        action,
        widgetId,
        data,
      });
    },
    recv: (responsePtr: number) => {
      const message = toWidgetMessages.pop();

      if (!message) {
        return 0;
      }

      moveCursorView(cursorView, responsePtr);
      writeCString(cursorView, message.api);
      writeCString(cursorView, message.requestId);
      writeCString(cursorView, message.action);
      writeCString(cursorView, message.widgetId);

      if (message.error) {
        writeInt32(cursorView, 1);
        writeCString(cursorView, JSON.stringify(message.error));
      } else {
        writeInt32(cursorView, 0);
        writeCString(cursorView, JSON.stringify(message.response));
      }

      return toWidgetMessages.length;
    },
  };
}
