import { vec2 } from "gl-matrix";

export const NametagsMessage = "nametags-message";

export type NametagsMessageType = {
  type: typeof NametagsMessage;
  nametags: [string, vec2, number][];
};
