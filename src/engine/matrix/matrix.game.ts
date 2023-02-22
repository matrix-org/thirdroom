import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { readString, WASMModuleContext, writeEncodedString } from "../scripting/WASMModuleContext";
import { createDisposables } from "../utils/createDisposables";
import { MatrixMessageType, WidgetMessage } from "./matrix.common";

interface MatrixModuleState {
  textEncoder: TextEncoder;
  listening: boolean;
  inboundWidgetMessages: Uint8Array[];
}

export const MatrixModule = defineModule<GameState, MatrixModuleState>({
  name: "matrix",
  create: () => {
    return {
      textEncoder: new TextEncoder(),
      listening: false,
      inboundWidgetMessages: [],
    };
  },
  init(ctx: GameState) {
    return createDisposables([registerMessageHandler(ctx, MatrixMessageType.WidgetMessage, onWidgetMessage)]);
  },
});

function onWidgetMessage(ctx: GameState, message: WidgetMessage) {
  const { inboundWidgetMessages, listening, textEncoder } = getModule(ctx, MatrixModule);

  if (listening) {
    const json = JSON.stringify(message.message);
    const encodedMessage = textEncoder.encode(json);
    inboundWidgetMessages.push(encodedMessage);
  }
}

export function createMatrixWASMModule(ctx: GameState, wasmCtx: WASMModuleContext) {
  const matrixModule = getModule(ctx, MatrixModule);

  return {
    listen() {
      if (matrixModule.listening) {
        console.error("Matrix: Cannot listen for events, already in a listening state.");
        return -1;
      }

      matrixModule.listening = true;
      return 0;
    },
    close() {
      if (!matrixModule.listening) {
        console.error("Matrix: Cannot close event listener, already in a closed state.");
        return -1;
      }

      matrixModule.inboundWidgetMessages.length = 0;
      matrixModule.listening = false;
      return 0;
    },
    send(eventPtr: number, byteLength: number) {
      try {
        const eventStr = readString(wasmCtx, eventPtr, byteLength);

        const event = JSON.parse(eventStr);

        ctx.sendMessage<WidgetMessage>(Thread.Main, {
          type: MatrixMessageType.WidgetMessage,
          message: event,
        });

        return 0;
      } catch (error) {
        console.error("Matrix: Error sending event", error);
        return -1;
      }
    },
    get_event_size() {
      const messages = matrixModule.inboundWidgetMessages;
      return messages.length === 0 ? 0 : messages[messages.length - 1].byteLength + 1;
    },
    receive(eventBufPtr: number, maxBufLength: number) {
      try {
        if (!matrixModule.listening) {
          console.error("Matrix: Cannot receive events in a closed state.");
          return -1;
        }

        const message = matrixModule.inboundWidgetMessages.pop();

        if (!message) {
          return 0;
        }

        if (message.byteLength > maxBufLength) {
          console.error("Matrix: Error receiving event: Packet is larger than target buffer.");
          return -1;
        }

        return writeEncodedString(wasmCtx, eventBufPtr, message);
      } catch (error) {
        console.error("Matrix: Error receiving event: ", error);
        return -1;
      }
    },
  };
}
