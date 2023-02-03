import { Room, Session, Timeline } from "@thirdroom/hydrogen-view-sdk";

import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { MatrixAPIAction, MatrixAPIMessageType, MatrixFromWidgetMessage, MatrixToWidgetMessage } from "./matrix.common";

interface MatrixModuleState {
  activeRoom?: Room;
  activeTimeline?: Timeline;
}

export const MatrixModule = defineModule<IMainThreadContext, MatrixModuleState>({
  name: "matrix",
  create: () => {
    return {};
  },
  init(ctx: IMainThreadContext) {
    return createDisposables([registerMessageHandler(ctx, MatrixAPIMessageType.FromWidget, onFromWidgetMessage)]);
  },
});

async function onFromWidgetMessage(ctx: IMainThreadContext, message: MatrixFromWidgetMessage) {
  const { activeRoom } = getModule(ctx, MatrixModule);

  if (!activeRoom) {
    return;
  }

  try {
    const { action, data } = message;

    if (action === MatrixAPIAction.RoomMessage) {
      const msgtype = data?.content?.msgtype;
      const body = data?.content?.body;

      let errorMessage: string | undefined;

      if (typeof msgtype !== "string") {
        errorMessage = "msgtype isn't a string";
      } else if (typeof body !== "string") {
        errorMessage = "body isn't a string";
      }

      if (errorMessage) {
        console.log(`Script attempted to send a malformed Matrix action ${action}: "${errorMessage}"`);

        ctx.sendMessage<MatrixToWidgetMessage>(Thread.Game, {
          type: MatrixAPIMessageType.ToWidget,
          api: message.api,
          requestId: message.requestId,
          action,
          widgetId: message.widgetId,
          error: {
            message: errorMessage,
          },
        });
        return;
      }

      try {
        await activeRoom.sendEvent(action, { msgtype, body });
      } catch (error) {
        ctx.sendMessage<MatrixToWidgetMessage>(Thread.Game, {
          type: MatrixAPIMessageType.ToWidget,
          api: message.api,
          requestId: message.requestId,
          action,
          widgetId: message.widgetId,
          error: {
            message: "Error sending event.",
          },
        });
      }
    } else {
      console.log(`Script attempted to send an unsupported Matrix action type ${action}.`);

      ctx.sendMessage<MatrixToWidgetMessage>(Thread.Game, {
        type: MatrixAPIMessageType.ToWidget,
        api: message.api,
        requestId: message.requestId,
        action,
        widgetId: message.widgetId,
        error: {
          message: `Unsupported action type ${message.action}`,
        },
      });
    }
  } catch (error) {
    console.error(error);

    ctx.sendMessage<MatrixToWidgetMessage>(Thread.Game, {
      type: MatrixAPIMessageType.ToWidget,
      api: message.api,
      requestId: message.requestId,
      action: message.action,
      widgetId: message.widgetId,
      error: {
        message: "Unknown error occurred when sending event.",
      },
    });
  }
}

export async function onEnterWorld(ctx: IMainThreadContext, session: Session, roomId: string) {
  const matrixModule = getModule(ctx, MatrixModule);

  const room = session.rooms.get(roomId);

  matrixModule.activeRoom = room;

  if (!room) {
    throw new Error(`Couldn't find room ${roomId}`);
  }

  if (matrixModule.activeTimeline) {
    matrixModule.activeTimeline.dispose();
    matrixModule.activeTimeline = undefined;
  }

  const enteredTimestamp = Date.now();

  const timeline = await room.openTimeline();

  matrixModule.activeTimeline = timeline;

  timeline.entries.subscribe({
    onAdd(index, value, list) {
      if ("timestamp" in value && value.timestamp > enteredTimestamp) {
        console.log("onAdd", { index, value, list });
      }
    },
    onMove(from, to, value, list) {
      console.log("onMove", { from, to, value, list });
    },
    onUpdate(index, value, params, list) {
      console.log("onUpdate", { index, value, params, list });
    },
    onRemove(index, value, list) {
      console.log("onRemove", { index, value, list });
    },
    onReset(list) {
      console.log("onReset", { list });
    },
  });
}

export function onExitWorld(ctx: IMainThreadContext) {
  const matrixModule = getModule(ctx, MatrixModule);

  matrixModule.activeRoom = undefined;

  if (matrixModule.activeTimeline) {
    matrixModule.activeTimeline.dispose();
    matrixModule.activeTimeline = undefined;
  }
}
