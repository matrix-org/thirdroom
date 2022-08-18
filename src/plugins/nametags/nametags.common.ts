import { vec2 } from "gl-matrix";

export const NametagsEnableMessage = "nametags-enable-message";
export const NametagsMessage = "nametags-message";

// main->game
export type NametagsEnableMessageType = {
  type: typeof NametagsEnableMessage;
  enabled: boolean;
};

// game->main
export type NametagsMessageType = {
  type: typeof NametagsMessage;
  nametags: [string, vec2, number][];
};
