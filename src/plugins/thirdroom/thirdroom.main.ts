import { IMainThreadContext } from "../../engine/MainThread";
import { defineModule, getModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { createDisposables } from "../../engine/utils/createDisposables";
import { createDeferred } from "../../engine/utils/Deferred";
import { registerThirdroomGlobalFn } from "../../engine/utils/registerThirdroomGlobal";
import {
  WorldLoadedMessage,
  WorldLoadErrorMessage,
  LoadWorldMessage,
  PrintThreadStateMessage,
  ThirdRoomMessageType,
} from "./thirdroom.common";

interface ThirdRoomModuleState {
  loadWorldMessageId: number;
  environmentUrl?: string;
}

export const ThirdroomModule = defineModule<IMainThreadContext, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {
      loadWorldMessageId: 0,
    };
  },
  init(ctx) {
    registerThirdroomGlobalFn("printThreadState", () => {
      ctx.sendMessage<PrintThreadStateMessage>(Thread.Game, {
        type: ThirdRoomMessageType.PrintThreadState,
      });

      ctx.sendMessage<PrintThreadStateMessage>(Thread.Render, {
        type: ThirdRoomMessageType.PrintThreadState,
      });

      console.log(Thread.Main, ctx);
    });
  },
});

export function loadWorld(ctx: IMainThreadContext, url: string, scriptUrl: string) {
  const thirdroom = getModule(ctx, ThirdroomModule);
  const loadingEnvironment = createDeferred(false);

  const id = thirdroom.loadWorldMessageId++;

  // eslint-disable-next-line prefer-const
  let disposeHandlers: () => void;

  const onLoadWorld = (ctx: IMainThreadContext, message: WorldLoadedMessage) => {
    if (message.id === id) {
      if (message.url === thirdroom.environmentUrl) {
        loadingEnvironment.resolve(undefined);
      } else {
        loadingEnvironment.reject(new Error("Environment changed before it was finished loading."));
      }

      disposeHandlers();
    }
  };

  const onLoadWorldError = (ctx: IMainThreadContext, message: WorldLoadErrorMessage) => {
    console.log(`error`, message);
    if (message.id === id) {
      loadingEnvironment.reject(new Error(message.error));
      disposeHandlers();
    }
  };

  disposeHandlers = createDisposables([
    registerMessageHandler(ctx, ThirdRoomMessageType.WorldLoaded, onLoadWorld),
    registerMessageHandler(ctx, ThirdRoomMessageType.WorldLoadError, onLoadWorldError),
  ]);

  thirdroom.environmentUrl = url;

  ctx.sendMessage<LoadWorldMessage>(Thread.Game, {
    type: ThirdRoomMessageType.LoadWorld,
    id,
    url,
    scriptUrl,
  });

  return loadingEnvironment.promise;
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
