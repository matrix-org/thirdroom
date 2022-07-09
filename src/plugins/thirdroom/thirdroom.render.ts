import { defineModule, getModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { RenderThreadState } from "../../engine/renderer/renderer.render";
import { ResourceModule } from "../../engine/resource/resource.render";
import { ThirdRoomMessageType } from "./thirdroom.common";

type ThirdRoomModuleState = {};

export const ThirdroomModule = defineModule<RenderThreadState, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {};
  },
  init(ctx) {
    return registerMessageHandler(ctx, ThirdRoomMessageType.PrintResources, onPrintResources);
  },
});

function onPrintResources(ctx: RenderThreadState) {
  console.log(Thread.Render, getModule(ctx, ResourceModule));
}
