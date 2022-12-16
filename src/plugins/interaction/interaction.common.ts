import { InteractableType } from "../../engine/resource/schema";

export const InteractionMessageType = "interaction";

export enum InteractableAction {
  Focus = "focus",
  Unfocus = "unfocus",
  Interact = "interact",
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
