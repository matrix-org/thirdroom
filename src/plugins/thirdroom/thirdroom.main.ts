import { IMainThreadContext } from "../../engine/MainThread";
import { Thread } from "../../engine/module/module.common";
import { ThirdRoomMessageType } from "./thirdroom.common";

export function loadEnvironment(context: IMainThreadContext, url: string) {
  context.sendMessage(Thread.Game, {
    type: ThirdRoomMessageType.LoadEnvironment,
    url,
  });
}

export function enterWorld(context: IMainThreadContext) {
  context.sendMessage(Thread.Game, {
    type: ThirdRoomMessageType.EnterWorld,
  });
}

export function exitWorld(context: IMainThreadContext) {
  context.sendMessage(Thread.Game, {
    type: ThirdRoomMessageType.ExitWorld,
  });
}
