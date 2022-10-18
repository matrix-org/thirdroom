export const InteractionMessageType = "interaction";

export enum InteractableType {
  Object = 1,
  Player = 2,
  Portal = 3,
}

export enum InteractableAction {
  Focus = "focus",
  Unfocus = "unfocus",
  Grab = "grab",
  Release = "release",
}

export interface InteractionMessage {
  type: typeof InteractionMessageType;
  action: InteractableAction;
  interactableType?: InteractableType;
  name?: string;
  held?: boolean;
  peerId?: string;
  ownerId?: string;
  uri?: string;
}
