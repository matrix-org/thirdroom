export const ObjectCapReachedMessageType = "object-cap-reached";

export interface ObjectCapReachedMessage {
  type: typeof ObjectCapReachedMessageType;
}

export const SetObjectCapMessageType = "object-cap-reached";

export interface SetObjectCapMessage {
  type: typeof SetObjectCapMessageType;
  value: number;
}
