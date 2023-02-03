import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { ScriptResourceManager } from "../resource/ScriptResourceManager";
import { decodeString } from "../resource/strings";
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

export function createMatrixWASMModule(ctx: GameState, resourceManager: ScriptResourceManager) {
  const { inboundWidgetMessages } = getModule(ctx, MatrixModule);
  const { U8Heap } = resourceManager;

  return {
    send_widget_message: (requestPtr: number) => {
      const messageStr = decodeString(requestPtr, U8Heap);

      try {
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
    receive_widget_message: () => {
      const message = inboundWidgetMessages.pop();

      if (!message) {
        return 0;
      }

      const messageStr = JSON.stringify(message);

      return resourceManager.writeString(messageStr);
    },
  };
}
