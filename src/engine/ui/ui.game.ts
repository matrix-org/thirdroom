import { GameState } from "../GameTypes";
import { defineModule, registerMessageHandler } from "../module/module.common";
import { RemoteNode } from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { createDisposables } from "../utils/createDisposables";
import { WebSGUIMessage } from "./ui.common";

export const WebSGUIModule = defineModule<GameState, {}>({
  name: "GameWebSGUI",
  create: async () => {
    return {};
  },
  async init(ctx: GameState) {
    return createDisposables([
      registerMessageHandler(ctx, WebSGUIMessage.DoneDrawing, (ctx, message) => {
        const node = tryGetRemoteResource<RemoteNode>(ctx, (message as any).eid);
        node.uiCanvas!.needsRedraw = false;
      }),
    ]);
  },
});
