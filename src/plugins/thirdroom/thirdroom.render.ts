import { defineModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { RenderContext } from "../../engine/renderer/renderer.render";
import { ThirdRoomMessageType } from "./thirdroom.common";

type ThirdRoomModuleState = {};

export const ThirdroomModule = defineModule<RenderContext, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {};
  },
  init(ctx) {
    return registerMessageHandler(ctx, ThirdRoomMessageType.PrintThreadState, onPrintThreadState);
  },
});

function onPrintThreadState(ctx: RenderContext) {
  console.log(Thread.Render, ctx);
}
