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
  PrintResourcesMessage,
  EnteredWorldMessage,
  EnterWorldErrorMessage,
  EnterWorldMessage,
  FindResourceRetainersMessage,
} from "./thirdroom.common";

interface ThirdRoomModuleState {
  messageId: number;
  environmentUrl?: string;
}

export const ThirdroomModule = defineModule<IMainThreadContext, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {
      messageId: 0,
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

    registerThirdroomGlobalFn("printResources", () => {
      ctx.sendMessage<PrintResourcesMessage>(Thread.Game, {
        type: ThirdRoomMessageType.PrintResources,
      });
    });

    registerThirdroomGlobalFn("findResourceRetainers", (resourceId) => {
      ctx.sendMessage<FindResourceRetainersMessage>(Thread.Game, {
        type: ThirdRoomMessageType.FindResourceRetainers,
        resourceId,
      });
    });
  },
});

export async function loadWorld(ctx: IMainThreadContext, url: string, scriptUrl: string) {
  const thirdroom = getModule(ctx, ThirdroomModule);
  const loadingEnvironment = createDeferred(false);

  const id = thirdroom.messageId++;

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

export async function enterWorld(ctx: IMainThreadContext) {
  const thirdroom = getModule(ctx, ThirdroomModule);
  const enteringWorld = createDeferred(false);

  const id = thirdroom.messageId++;

  // eslint-disable-next-line prefer-const
  let disposeHandlers: () => void;

  const onEnteredWorld = (ctx: IMainThreadContext, message: EnteredWorldMessage) => {
    if (message.id === id) {
      enteringWorld.resolve(undefined);
      disposeHandlers();
    }
  };

  const onEnterWorldError = (ctx: IMainThreadContext, message: EnterWorldErrorMessage) => {
    console.log(`error`, message);
    if (message.id === id) {
      enteringWorld.reject(new Error(message.error));
      disposeHandlers();
    }
  };

  disposeHandlers = createDisposables([
    registerMessageHandler(ctx, ThirdRoomMessageType.EnteredWorld, onEnteredWorld),
    registerMessageHandler(ctx, ThirdRoomMessageType.EnterWorldError, onEnterWorldError),
  ]);

  ctx.sendMessage<EnterWorldMessage>(Thread.Game, {
    type: ThirdRoomMessageType.EnterWorld,
    id,
  });

  return enteringWorld.promise;
}

export function exitWorld(context: IMainThreadContext) {
  context.sendMessage(Thread.Game, {
    type: ThirdRoomMessageType.ExitWorld,
  });
}
