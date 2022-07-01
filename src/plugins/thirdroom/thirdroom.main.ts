import { IMainThreadContext } from "../../engine/MainThread";
import { defineModule, getModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { createDisposables } from "../../engine/utils/createDisposables";
import { createDeferred } from "../../engine/utils/Deferred";
import {
  EnvironmentLoadedMessage,
  EnvironmentLoadErrorMessage,
  LoadEnvironmentMessage,
  ThirdRoomMessageType,
} from "./thirdroom.common";

interface ThirdRoomModuleState {
  loadEnvironmentMessageId: number;
  environmentUrl?: string;
}

export const ThirdroomModule = defineModule<IMainThreadContext, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {
      loadEnvironmentMessageId: 0,
    };
  },
  init() {},
});

export function loadEnvironment(ctx: IMainThreadContext, url: string) {
  const thirdroom = getModule(ctx, ThirdroomModule);
  const loadingEnvironment = createDeferred(false);

  const id = thirdroom.loadEnvironmentMessageId++;

  // eslint-disable-next-line prefer-const
  let disposeHandlers: () => void;

  const onLoadEnvironment = (ctx: IMainThreadContext, message: EnvironmentLoadedMessage) => {
    if (message.id === id) {
      if (message.url === thirdroom.environmentUrl) {
        loadingEnvironment.resolve(undefined);
      } else {
        loadingEnvironment.reject(new Error("Environment changed before it was finished loading."));
      }

      disposeHandlers();
    }
  };

  const onEnvironmentLoadError = (ctx: IMainThreadContext, message: EnvironmentLoadErrorMessage) => {
    console.log(`error`, message);
    if (message.id === id) {
      loadingEnvironment.reject(new Error(message.error));
      disposeHandlers();
    }
  };

  disposeHandlers = createDisposables([
    registerMessageHandler(ctx, ThirdRoomMessageType.EnvironmentLoaded, onLoadEnvironment),
    registerMessageHandler(ctx, ThirdRoomMessageType.EnvironmentLoadError, onEnvironmentLoadError),
  ]);

  thirdroom.environmentUrl = url;

  ctx.sendMessage<LoadEnvironmentMessage>(Thread.Game, {
    type: ThirdRoomMessageType.LoadEnvironment,
    id,
    url,
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
