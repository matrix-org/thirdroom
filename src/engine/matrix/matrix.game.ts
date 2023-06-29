import { GameContext } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { ScriptComponent, scriptQuery } from "../scripting/scripting.game";
import { readString, WASMModuleContext, writeEncodedString } from "../scripting/WASMModuleContext";
import { createDisposables } from "../utils/createDisposables";
import { MatrixMessageType, WidgetMessage } from "./matrix.common";

interface MatrixModuleState {
  textEncoder: TextEncoder;
}

export const MatrixModule = defineModule<GameContext, MatrixModuleState>({
  name: "matrix",
  create: () => {
    return {
      textEncoder: new TextEncoder(),
    };
  },
  init(ctx: GameContext) {
    return createDisposables([registerMessageHandler(ctx, MatrixMessageType.WidgetMessage, onWidgetMessage)]);
  },
});

function onWidgetMessage(ctx: GameContext, message: WidgetMessage) {
  const { textEncoder } = getModule(ctx, MatrixModule);

  const scripts = scriptQuery(ctx.world);

  for (let i = 0; i < scripts.length; i++) {
    const script = ScriptComponent.get(scripts[i]);

    if (!script) {
      return;
    }

    const resourceManager = script.wasmCtx.resourceManager;

    if (resourceManager.matrixListening) {
      const json = JSON.stringify(message.message);
      const encodedMessage = textEncoder.encode(json);
      resourceManager.inboundMatrixWidgetMessages.push(encodedMessage);
    }
  }
}

export function createMatrixWASMModule(ctx: GameContext, wasmCtx: WASMModuleContext) {
  const matrixWASMModule = {
    listen() {
      const resourceManager = wasmCtx.resourceManager;
      if (resourceManager.matrixListening) {
        console.error("Matrix: Cannot listen for events, already in a listening state.");
        return -1;
      }

      resourceManager.matrixListening = true;
      return 0;
    },
    close() {
      const resourceManager = wasmCtx.resourceManager;
      if (!resourceManager.matrixListening) {
        console.error("Matrix: Cannot close event listener, already in a closed state.");
        return -1;
      }

      resourceManager.inboundMatrixWidgetMessages.length = 0;
      resourceManager.matrixListening = false;
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
      const resourceManager = wasmCtx.resourceManager;
      const messages = resourceManager.inboundMatrixWidgetMessages;
      return messages.length === 0 ? 0 : messages[messages.length - 1].byteLength + 1;
    },
    receive(eventBufPtr: number, maxBufLength: number) {
      const resourceManager = wasmCtx.resourceManager;
      try {
        if (!resourceManager.matrixListening) {
          console.error("Matrix: Cannot receive events in a closed state.");
          return -1;
        }

        const message = resourceManager.inboundMatrixWidgetMessages.pop();

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

  const disposeMatrixWASMModule = () => {
    const resourceManager = wasmCtx.resourceManager;
    resourceManager.matrixListening = false;
    resourceManager.inboundMatrixWidgetMessages.length = 0;
  };

  return [matrixWASMModule, disposeMatrixWASMModule] as const;
}
