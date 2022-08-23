export const NametagsEnableMessage = "nametags-enable-message";
export const NametagsMessage = "nametags-message";

// main->game
export type NametagsEnableMessageType = {
  type: typeof NametagsEnableMessage;
  enabled: boolean;
};
