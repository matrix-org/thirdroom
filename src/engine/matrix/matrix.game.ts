import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { readString, WASMModuleContext, writeString } from "../scripting/WASMModuleContext";
import { createDisposables } from "../utils/createDisposables";
import {
  MatrixMessageType,
  WidgetAPIErrorResponse,
  WidgetAPIRequest,
  WidgetAPIResponse,
  WidgetMessage,
} from "./matrix.common";

interface MatrixModuleState {
  inboundWidgetMessages: (WidgetAPIRequest | WidgetAPIResponse | WidgetAPIErrorResponse)[];
}

export const MatrixModule = defineModule<GameState, MatrixModuleState>({
  name: "matrix",
  create: () => {
    return {
      inboundWidgetMessages: [],
    };
  },
  init(ctx: GameState) {
    return createDisposables([registerMessageHandler(ctx, MatrixMessageType.WidgetMessage, onWidgetMessage)]);
  },
});

function onWidgetMessage(ctx: GameState, message: WidgetMessage) {
  const { inboundWidgetMessages } = getModule(ctx, MatrixModule);
  inboundWidgetMessages.push(message.message);
}

export function createMatrixWASMModule(ctx: GameState, wasmCtx: WASMModuleContext) {
  const { inboundWidgetMessages } = getModule(ctx, MatrixModule);

  return {
    send_widget_message: (requestPtr: number, byteLength: number) => {
      try {
        const messageStr = readString(wasmCtx, requestPtr, byteLength);

        const message = JSON.parse(messageStr);

        ctx.sendMessage<WidgetMessage>(Thread.Main, {
          type: MatrixMessageType.WidgetMessage,
          message,
        });

        return 0;
      } catch (error) {
        console.error("Error sending widget message:", error);
        return -1;
      }
    },
    receive_widget_message: (writeBufPtr: number, maxBufLength: number) => {
      try {
        const message = inboundWidgetMessages.pop();

        if (!message) {
          return 0;
        }

        const messageStr = JSON.stringify(message);
        const writeByteLength = writeString(wasmCtx, writeBufPtr, messageStr, maxBufLength);
        return writeByteLength;
      } catch (error) {
        console.error("Error receiving script packet: ", error);
        return -1;
      }
    },
  };
}
