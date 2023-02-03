export enum MatrixAPIMessageType {
  FromWidget = "fromWidget",
  ToWidget = "toWidget",
}

interface MatrixWidgetMessage {
  type: MatrixAPIMessageType;
  api: string;
  requestId: string;
  action: string;
  widgetId: string;
}

export enum MatrixAPIAction {
  RoomMessage = "m.room.message",
}

export interface MatrixFromWidgetMessage extends MatrixWidgetMessage {
  type: MatrixAPIMessageType.FromWidget;
  data?: any;
}

export interface MatrixToWidgetMessage extends MatrixWidgetMessage {
  type: MatrixAPIMessageType.ToWidget;
  error?: {
    message: string;
  };
  response?: {};
}
