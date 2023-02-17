import { Room, Session } from "@thirdroom/hydrogen-view-sdk";

import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { createDeferred, Deferred } from "../utils/Deferred";
import {
  ClientEvent,
  MatrixMessageType,
  WidgetAction,
  WidgetAPI,
  WidgetAPIErrorResponse,
  WidgetAPIRequest,
  WidgetAPIResponse,
  WidgetContentLoadedResponse,
  WidgetMessage,
  WidgetReadEventsData,
  WidgetSendEventData,
} from "./matrix.common";

interface WidgetContext {
  widgetId: string;
  capabilities: Map<string, Set<string>>;
  outboundRequests: Map<string, Deferred<WidgetAPIResponse> | null>;
  disposeTimeline?: () => void;
}

interface MatrixModuleState {
  activeSession?: Session;
  activeRoom?: Room;
  widgets: Map<string, WidgetContext>;
}

export const MatrixModule = defineModule<IMainThreadContext, MatrixModuleState>({
  name: "matrix",
  create: () => {
    return {
      widgets: new Map(),
    };
  },
  init(ctx: IMainThreadContext) {
    return createDisposables([registerMessageHandler(ctx, MatrixMessageType.WidgetMessage, onWidgetMessage)]);
  },
});

function onWidgetMessage(ctx: IMainThreadContext, widgetMessage: WidgetMessage) {
  const matrixModule = getModule(ctx, MatrixModule);

  const message = widgetMessage.message;

  if (!message.action || !message.requestId || !message.widgetId) return;

  if (!("response" in message)) {
    if (message.api !== WidgetAPI.FromWidget) return;
    handleWidgetRequest(ctx, matrixModule, message);
  } else {
    if (message.api !== WidgetAPI.ToWidget) return;
    handleWidgetResponse(matrixModule.widgets, message);
  }
}

function getNextRequestId(widget: WidgetContext) {
  const idBase = `widgetapi-${Date.now()}`;
  let index = 0;
  let id = idBase;
  while (widget.outboundRequests.has(id)) {
    id = `${idBase}-${index++}`;
  }

  // reserve the ID
  widget.outboundRequests.set(id, null);

  return id;
}

function reply<T extends { [key: string]: unknown }>(
  ctx: IMainThreadContext,
  request: WidgetAPIRequest,
  responseData: T
) {
  ctx.sendMessage<WidgetMessage>(Thread.Game, {
    type: MatrixMessageType.WidgetMessage,
    message: {
      ...request,
      response: responseData,
    },
  });
}

function sendComplete<T extends { [key: string]: unknown }, R extends WidgetAPIResponse>(
  ctx: IMainThreadContext,
  widget: WidgetContext,
  action: WidgetAction,
  data: T
): Promise<R> {
  const request: WidgetAPIRequest = {
    api: WidgetAPI.ToWidget,
    widgetId: widget.widgetId,
    requestId: getNextRequestId(widget),
    action,
    data,
  };

  const deferredResponse = createDeferred<R>(10 * 1000, "Request timed out.");

  widget.outboundRequests.set(request.requestId, deferredResponse);

  ctx.sendMessage<WidgetMessage>(Thread.Game, {
    type: MatrixMessageType.WidgetMessage,
    message: request,
  });

  return deferredResponse.promise.finally(() => {
    widget.outboundRequests.delete(request.requestId);
  });
}

// TODO: Don't actually export this. Just doing this to prevent linting errors
export function send<T extends { [key: string]: unknown }, R extends { [key: string]: unknown }>(
  ctx: IMainThreadContext,
  widget: WidgetContext,
  action: WidgetAction,
  data: T
): Promise<R> {
  return sendComplete<T, WidgetAPIResponse>(ctx, widget, action, data).then((r) => r.response as R);
}

function handleWidgetRequest(ctx: IMainThreadContext, matrixModule: MatrixModuleState, request: WidgetAPIRequest) {
  const { widgets } = matrixModule;

  const action = request.action;

  if (action === WidgetAction.ContentLoaded) {
    if (!widgets.has(request.widgetId)) {
      const widget: WidgetContext = {
        widgetId: request.widgetId,
        outboundRequests: new Map(),
        capabilities: new Map([
          ["m.send.event", new Set(["m.room.message#m.text"])],
          ["m.receive.event", new Set(["m.room.message", "org.matrix.msc3672.beacon"])],
        ]),
      };

      widgets.set(request.widgetId, widget);

      reply<WidgetContentLoadedResponse>(ctx, request, {});

      initializeRoomEventListener(ctx, matrixModule, widget);

      // TODO: Capabilities
    }

    return;
  }

  const widget = widgets.get(request.widgetId);

  if (!widget) return;

  switch (action) {
    case WidgetAction.SendEvent:
      return handleSendEventAction(ctx, matrixModule, widget, request);
    case WidgetAction.ReadEvents:
      return handleReadEventsAction(ctx, matrixModule, widget, request);
    default:
      return reply(ctx, request, {
        error: {
          message: "Unknown or unsupported action: " + action,
        },
      });
  }
}

function handleWidgetResponse(
  widgets: Map<string, WidgetContext>,
  response: WidgetAPIResponse | WidgetAPIErrorResponse
) {
  const widget = widgets.get(response.widgetId);

  if (!widget) return;

  const request = widget.outboundRequests.get(response.requestId);

  if (!request) return;

  if ("error" in response.response && (response.response.error as any).message) {
    request.reject(response.response.error.message);
  } else {
    request.resolve(response);
  }
}

async function initializeRoomEventListener(
  ctx: IMainThreadContext,
  matrixModule: MatrixModuleState,
  widget: WidgetContext
) {
  const session = matrixModule.activeSession;

  if (!session) {
    throw new Error("No session set");
  }

  const room = matrixModule.activeRoom;

  if (!room) {
    throw new Error("Room not loaded yet");
  }

  const timeline = await room.openTimeline();

  const unsubscribe = timeline.entries.subscribe({
    onAdd(index, entry, list) {
      if (
        !("isPending" in entry) &&
        "event" in entry &&
        widget.capabilities.get("m.receive.event")?.has(entry.eventType)
      ) {
        send(ctx, widget, WidgetAction.SendEvent, entry.event).catch((error) => {
          console.error(error);
        });
      }
    },
    onMove(from, to, value, list) {},
    onRemove(index, value, list) {},
    onUpdate(index, value, params, list) {},
    onReset(list) {},
  });

  widget.disposeTimeline = () => {
    unsubscribe();
    timeline.dispose();
  };
}

function ensureCapability(
  ctx: IMainThreadContext,
  widget: WidgetContext,
  request: WidgetAPIRequest,
  capability: string,
  eventType: string,
  requireKey: boolean,
  key?: string
) {
  const capabilities = widget.capabilities.get(capability);

  const hasCapability = requireKey ? capabilities?.has(`${eventType}#${key}`) : capabilities?.has(`${eventType}`);

  if (!hasCapability) {
    console.error(`Capability not allowed ${capability} ${eventType} ${key}`, widget.capabilities);

    reply(ctx, request, {
      error: {
        message: "Capability not allowed",
      },
    });

    return false;
  }

  return true;
}

function handleSendEventAction(
  ctx: IMainThreadContext,
  matrixModule: MatrixModuleState,
  widget: WidgetContext,
  request: WidgetAPIRequest
) {
  const session = matrixModule.activeSession;

  if (!session) {
    throw new Error("No session set");
  }

  const room = matrixModule.activeRoom;

  if (!room) {
    throw new Error("Room not loaded yet");
  }

  const data = request.data as WidgetSendEventData;

  if (!data.type) {
    return reply(ctx, request, {
      error: {
        message: "Invalid request - missing event type",
      },
    });
  }

  let sendEventPromise: Promise<unknown>;

  if (data.state_key !== null && data.state_key !== undefined) {
    if (!ensureCapability(ctx, widget, request, "m.send.state_event", data.type, true, data.state_key)) return;
    sendEventPromise = session.hsApi.sendState(room.id, data.type, data.state_key, data.content || {}).response();
  } else {
    if (data.type === "m.room.message") {
      if (!("msgtype" in data.content)) {
        return reply(ctx, request, {
          error: {
            message: "Invalid request - missing msgtype",
          },
        });
      }

      if (!ensureCapability(ctx, widget, request, "m.send.event", data.type, true, data.content.msgtype as string))
        return;
    } else {
      if (!ensureCapability(ctx, widget, request, "m.send.event", data.type, false)) return;
    }

    sendEventPromise = room.sendEvent(data.type, data.content);
  }

  sendEventPromise
    .then((event: any) => {
      // TODO: Hydrogen doesn't make it easy to get the event id...
      reply(ctx, request, {
        room_id: event?.room_id,
        event_id: event?.event_id,
      });
    })
    .catch((error) => {
      console.error("Error sending event: ", error);
      reply(ctx, request, {
        error: {
          message: "Error sending event",
        },
      });
    });
}

const DEFAULT_TIMELINE_LOAD_LIMIT = 1000;

function handleReadEventsAction(
  ctx: IMainThreadContext,
  matrixModule: MatrixModuleState,
  widget: WidgetContext,
  request: WidgetAPIRequest
) {
  const session = matrixModule.activeSession;

  if (!session) {
    throw new Error("No session set");
  }

  const room = matrixModule.activeRoom;

  if (!room) {
    throw new Error("Room not loaded yet");
  }

  const data = request.data as WidgetReadEventsData;

  if (!data.type) {
    return reply(ctx, request, {
      error: {
        message: "Invalid request - missing event type",
      },
    });
  }

  if (data.limit !== undefined && (!data.limit || data.limit < 0)) {
    return reply(ctx, request, {
      error: {
        message: "Invalid request - limit out of range",
      },
    });
  }

  if (data.room_ids !== undefined) {
    return reply(ctx, request, {
      error: {
        message: "Reading events from multiple rooms is not currently supported.",
      },
    });
  }

  const limit = data.limit || 0;

  let events: Promise<ClientEvent[]> = Promise.resolve([]);

  if (data.state_key !== undefined) {
    const stateKey = data.state_key === true ? undefined : data.state_key.toString();

    if (stateKey) {
      if (!ensureCapability(ctx, widget, request, "m.receive.event", data.type, true, stateKey)) return;

      events = room.observeStateTypeAndKey(data.type, stateKey).then((value) => {
        const stateEvent = value.get() as ClientEvent | undefined;

        if (stateEvent) {
          return [stateEvent];
        } else {
          return [];
        }
      });
    } else {
      if (!ensureCapability(ctx, widget, request, "m.receive.event", data.type, false)) return;

      events = room.observeStateType(data.type).then((map) => {
        const items = Array.from(map.values()) as ClientEvent[];

        if (limit) {
          return items.slice(0, limit);
        } else {
          return items;
        }
      });
    }
  } else {
    if (!ensureCapability(ctx, widget, request, "m.receive.event", data.type, false)) return;

    events = room.openTimeline().then(async (timeline) => {
      const items: ClientEvent[] = [];

      const deferred = createDeferred<void>(3000);

      const unsubscribe = timeline.entries.subscribe({
        onAdd(index, entry, list) {
          if (!("isPending" in entry) && "event" in entry && entry.eventType === data.type) {
            items.push(entry.event);

            if (items.length >= limit) {
              deferred.resolve();
            }
          }
        },
        onMove(from, to, value, list) {},
        onRemove(index, value, list) {},
        onUpdate(index, value, params, list) {},
        onReset(list) {},
      });

      await timeline.loadAtTop(DEFAULT_TIMELINE_LOAD_LIMIT);

      try {
        await deferred.promise;
      } catch (error) {}

      unsubscribe();

      timeline.dispose();

      return items;
    });
  }

  return events.then((evs) => {
    reply(ctx, request, {
      events: evs,
    });
  });
}

export async function setActiveMatrixRoom(ctx: IMainThreadContext, session: Session, roomId: string) {
  const matrixModule = getModule(ctx, MatrixModule);

  const room = session.rooms.get(roomId);

  if (!room) {
    throw new Error("Cannot find room");
  }

  matrixModule.activeRoom = room;
  matrixModule.activeSession = session;
}

export function disposeActiveMatrixRoom(ctx: IMainThreadContext) {
  const matrixModule = getModule(ctx, MatrixModule);
  matrixModule.activeRoom = undefined;
  matrixModule.activeSession = undefined;

  for (const widget of matrixModule.widgets.values()) {
    for (const request of widget.outboundRequests.values()) {
      request?.reject("Closed Widget");
    }

    if (widget.disposeTimeline) {
      widget.disposeTimeline();
    }
  }

  matrixModule.widgets.clear();
}
