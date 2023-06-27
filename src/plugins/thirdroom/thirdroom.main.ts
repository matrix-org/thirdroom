import { MainContext } from "../../engine/MainThread";
import { defineModule, getModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { NetworkModule } from "../../engine/network/network.main";
import { printRenderThreadState, togglePhysicsDebug } from "../../engine/renderer/renderer.main";
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
  SetActionBarItemsMessage,
  ActionBarItem,
  LoadWorldOptions,
  ReloadWorldMessage,
  ReloadWorldErrorMessage,
  ReloadedWorldMessage,
} from "./thirdroom.common";

interface ThirdRoomModuleState {
  messageId: number;
  environmentUrl?: string;
  actionBarItems: ActionBarItem[];
}

export const ThirdroomModule = defineModule<MainContext, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {
      messageId: 0,
      actionBarItems: [],
    };
  },
  init(ctx) {
    registerThirdroomGlobalFn("printThreadState", () => {
      ctx.sendMessage<PrintThreadStateMessage>(Thread.Game, {
        type: ThirdRoomMessageType.PrintThreadState,
      });

      printRenderThreadState(ctx);

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

    registerThirdroomGlobalFn("togglePhysicsDebug", () => {
      togglePhysicsDebug(ctx);
    });

    return createDisposables([
      registerMessageHandler(ctx, ThirdRoomMessageType.SetActionBarItems, onSetActionBarItems),
    ]);
  },
});

export async function loadWorld(ctx: MainContext, environmentUrl: string, options: LoadWorldOptions) {
  const thirdroom = getModule(ctx, ThirdroomModule);
  const loadingEnvironment = createDeferred(false);

  const id = thirdroom.messageId++;

  // eslint-disable-next-line prefer-const
  let disposeHandlers: () => void;

  const onLoadWorld = (ctx: MainContext, message: WorldLoadedMessage) => {
    if (message.id === id) {
      if (message.url === thirdroom.environmentUrl) {
        loadingEnvironment.resolve(undefined);
      } else {
        loadingEnvironment.reject(new Error("Environment changed before it was finished loading."));
      }

      disposeHandlers();
    }
  };

  const onLoadWorldError = (ctx: MainContext, message: WorldLoadErrorMessage) => {
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

  thirdroom.environmentUrl = environmentUrl;

  ctx.sendMessage<LoadWorldMessage>(Thread.Game, {
    type: ThirdRoomMessageType.LoadWorld,
    id,
    environmentUrl,
    options,
  });

  return loadingEnvironment.promise;
}

export function enterWorld(ctx: MainContext, localPeerId: string) {
  const thirdroom = getModule(ctx, ThirdroomModule);
  const network = getModule(ctx, NetworkModule);
  const enteringWorld = createDeferred(false);

  const id = thirdroom.messageId++;

  // eslint-disable-next-line prefer-const
  let disposeHandlers: () => void;

  const onEnteredWorld = (ctx: MainContext, message: EnteredWorldMessage) => {
    if (message.id === id) {
      enteringWorld.resolve(undefined);
      disposeHandlers();
    }
  };

  const onEnterWorldError = (ctx: MainContext, message: EnterWorldErrorMessage) => {
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

  network.peerId = localPeerId;

  ctx.sendMessage<EnterWorldMessage>(Thread.Game, {
    type: ThirdRoomMessageType.EnterWorld,
    id,
    localPeerId,
  });

  return enteringWorld.promise;
}

export function reloadWorld(ctx: MainContext, environmentUrl: string, options: LoadWorldOptions) {
  const thirdroom = getModule(ctx, ThirdroomModule);
  const reloadingWorld = createDeferred(false);

  const id = thirdroom.messageId++;

  // eslint-disable-next-line prefer-const
  let disposeHandlers: () => void;

  const onReloadedWorld = (ctx: MainContext, message: ReloadedWorldMessage) => {
    if (message.id === id) {
      reloadingWorld.resolve(undefined);
      disposeHandlers();
    }
  };

  const onReloadWorldError = (ctx: MainContext, message: ReloadWorldErrorMessage) => {
    console.log(`error`, message);
    if (message.id === id) {
      reloadingWorld.reject(new Error(message.error));
      disposeHandlers();
    }
  };

  disposeHandlers = createDisposables([
    registerMessageHandler(ctx, ThirdRoomMessageType.ReloadedWorld, onReloadedWorld),
    registerMessageHandler(ctx, ThirdRoomMessageType.ReloadWorldError, onReloadWorldError),
  ]);

  ctx.sendMessage<ReloadWorldMessage>(Thread.Game, {
    type: ThirdRoomMessageType.ReloadWorld,
    id,
    environmentUrl,
    options,
  });

  return reloadingWorld.promise;
}

export function exitWorld(context: MainContext) {
  context.sendMessage(Thread.Game, {
    type: ThirdRoomMessageType.ExitWorld,
  });
}

function onSetActionBarItems(ctx: MainContext, message: SetActionBarItemsMessage) {
  const thirdroom = getModule(ctx, ThirdroomModule);
  thirdroom.actionBarItems = message.actionBarItems;
}
