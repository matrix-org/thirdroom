import { defineModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { RenderThreadState } from "../../engine/renderer/renderer.render";
import { ThirdRoomMessageType } from "./thirdroom.common";

type ThirdRoomModuleState = {};

export const ThirdroomModule = defineModule<RenderThreadState, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {};
  },
  init(ctx) {
    return registerMessageHandler(ctx, ThirdRoomMessageType.PrintThreadState, onPrintThreadState);
  },
});

function onPrintThreadState(ctx: RenderThreadState) {
  console.log(Thread.Render, ctx);
}
