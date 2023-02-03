export enum MatrixMessageType {
  WidgetMessage = "widget-message",
}

export interface WidgetMessage {
  type: MatrixMessageType.WidgetMessage;
  message: WidgetAPIRequest | WidgetAPIResponse | WidgetAPIErrorResponse;
}

// Where the message request from
export enum WidgetAPI {
  FromWidget = "fromWidget",
  ToWidget = "toWidget",
}

export enum WidgetAction {
  ContentLoaded = "content_loaded",
  SendEvent = "send_event",
  ReadEvents = "read_events",
}

export interface WidgetAPIRequest {
  api: WidgetAPI;
  requestId: string;
  action: string;
  widgetId: string;
  data: {};
}

export interface WidgetAPIResponse extends WidgetAPIRequest {
  response: {};
}

export interface WidgetAPIErrorResponse extends WidgetAPIResponse {
  response: {
    error: {
      message: string;
    };
  };
}

// https://spec.matrix.org/v1.5/client-server-api/#types-of-room-events
export interface ClientEvent<Content = {}> {
  content: Content;
  event_id: string;
  origin_server_ts: number;
  room_id: string;
  sender: string;
  state_key?: string;
  type: string;
  unsigned?: {
    age?: number;
    prev_content?: Content;
    redacted_because?: ClientEvent;
    transaction_id?: string;
  };
}

export type WidgetContentLoadedData = {};

export type WidgetContentLoadedResponse = {};

// https://github.com/matrix-org/matrix-spec-proposals/blob/travis/msc/widgets-send-receive-events/proposals/2762-widget-event-receiving.md
export interface WidgetReadEventsData {
  type: string;
  state_key?: string | boolean;
  limit?: number;
  // Currently unsupported
  room_ids?: string[] | "*";
}

export interface WidgetReadEventsResponse {
  events: ClientEvent[];
}

export interface WidgetSendEventData<Content extends {} = {}> {
  type: string;
  // Use sendStateEvent if present otherwise use sendEvent except if it is a redaction event.
  // Note on special redacts case: https://github.com/matrix-org/matrix-spec-proposals/blob/travis/msc/widgets-send-receive-events/proposals/2762-widget-event-receiving.md#special-case-redactions
  state_key?: string;
  content: Content;
  // Currently Unsupported
  room_id?: string;
}

export interface WidgetSendEventResponse {
  room_id: string;
  event_id: string;
}
