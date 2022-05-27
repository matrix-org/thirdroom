export type ThreadSystem<ThreadContext extends BaseThreadContext> = (ctx: ThreadContext) => void;

export interface BaseThreadContext {
  systems: ThreadSystem<any>[];
  modules: Map<Module<any, any>, any>;
  sendMessage<M extends Message<any>>(
    thread: Thread,
    message: M,
    transferList?: (Transferable | OffscreenCanvas)[]
  ): void;
  messageHandlers: Map<string, MessageHandler<any, string, Message<any>>[]>;
}

export function getModule<ThreadContext extends BaseThreadContext, ModuleState extends {}>(
  threadContext: ThreadContext,
  module: Module<ThreadContext, ModuleState>
): ModuleState {
  return threadContext.modules.get(module);
}

export enum Thread {
  Main = "main",
  Game = "game",
  Render = "render",
}

export interface ModuleLoader {
  sendMessage<Message>(
    thread: Thread,
    type: string,
    message: Message,
    transferList?: (Transferable | OffscreenCanvas)[]
  ): void;
  waitForMessage<Message>(type: string): Promise<Message>;
}

export interface Module<ThreadContext extends BaseThreadContext, ModuleState extends {}> {
  name: string;
  create:
    | ((ctx: ThreadContext, loader: ModuleLoader) => ModuleState)
    | ((ctx: ThreadContext, loader: ModuleLoader) => Promise<ModuleState>);
  init: (ctx: ThreadContext) => void | (() => void) | Promise<void> | Promise<() => void>;
}

export function defineModule<ThreadContext extends BaseThreadContext, ModuleState extends {}>(
  moduleDef: Module<ThreadContext, ModuleState>
) {
  return moduleDef;
}

interface ModuleLoaderMessage<Message> {
  type: "module-loader";
  loaderMessageType: string;
  moduleName: string;
  message: Message;
}

export async function registerModules<ThreadContext extends BaseThreadContext>(
  context: ThreadContext,
  modules: Module<ThreadContext, {}>[]
) {
  const deferreds: {
    loaderMessageType: string;
    moduleName: string;
    resolve: (message: any) => void;
    reject: (error: Error) => void;
  }[] = [];

  const moduleLoaderMessageQueue: ModuleLoaderMessage<any>[] = [];

  // TODO: waitForMessage might not be called by the time we receive the message it's waiting for,
  // queue messages as they come in and check for the message immediately in waitForMessage
  const disposeModuleLoaderMessageHandler = registerMessageHandler(
    context,
    "module-loader",
    (_context, message: ModuleLoaderMessage<any>) => {
      const deferred = deferreds.find(
        (d) => d.loaderMessageType === message.loaderMessageType && d.moduleName === message.moduleName
      );

      if (deferred) {
        console.log(`waitForMessage: ${message.moduleName} ${message.loaderMessageType} found`);
        deferred.resolve(message.message);
      } else {
        console.log(`waitForMessage: ${message.moduleName} ${message.loaderMessageType} queued`);
        moduleLoaderMessageQueue.push(message);
      }
    }
  );

  const createLoaderContext = (moduleName: string): ModuleLoader => ({
    sendMessage: <Message>(
      thread: Thread,
      type: string,
      message: Message,
      transferList?: (Transferable | OffscreenCanvas)[]
    ) => {
      console.log(`sendMessage to ${thread}: ${moduleName} ${type}`, message);
      context.sendMessage(
        thread,
        { type: "module-loader", loaderMessageType: type, moduleName, message },
        transferList
      );
    },
    waitForMessage: <Message>(type: string): Promise<Message> => {
      console.log(`waitForMessage: ${moduleName} ${type}`);
      const index = moduleLoaderMessageQueue.findIndex(
        (d) => d.loaderMessageType === type && d.moduleName === moduleName
      );

      if (index !== -1) {
        const message = moduleLoaderMessageQueue[index];
        moduleLoaderMessageQueue.splice(index, 1);
        console.log(`waitForMessage: ${moduleName} ${type} found`);
        return Promise.resolve(message.message);
      }

      // TODO: Add timeout and error message indicating what the module was waiting on
      return new Promise((resolve, reject) => {
        deferreds.push({ loaderMessageType: type, moduleName, resolve, reject });
      });
    },
  });

  const moduleDisposeFunctions: (() => void)[] = [];

  const createPromises = modules.map((module) => {
    const result = module.create(context, createLoaderContext(module.name));

    if (result.hasOwnProperty("then")) {
      return result;
    } else {
      return Promise.resolve(result);
    }
  });

  const moduleStates = await Promise.all(createPromises);

  disposeModuleLoaderMessageHandler();

  for (let i = 0; i < moduleStates.length; i++) {
    const module = modules[i];
    const moduleState = moduleStates[i];
    context.modules.set(module, moduleState);
  }

  for (const module of modules) {
    const result = module.init(context);

    let dispose: (() => void) | void;

    if (typeof result === "object") {
      dispose = await result;
    } else {
      dispose = result;
    }

    if (dispose) {
      moduleDisposeFunctions.push(dispose);
    }
  }

  return () => {
    for (const dispose of moduleDisposeFunctions) {
      dispose();
    }
  };
}

export interface Message<Type> {
  type: Type;
}

export type MessageHandler<ThreadContext, T extends string, M extends Message<T>> = (
  ctx: ThreadContext,
  message: M
) => void;

export function registerMessageHandler<ThreadContext extends BaseThreadContext, T extends string, M extends Message<T>>(
  ctx: ThreadContext,
  type: T,
  handler: MessageHandler<ThreadContext, T, M>
) {
  let handlers = ctx.messageHandlers.get(type);

  if (!handlers) {
    handlers = [];
    ctx.messageHandlers.set(type, handlers);
  }

  handlers.push(handler as unknown as any);

  return () => {
    const handlers = ctx.messageHandlers.get(type);

    if (handlers) {
      const index = handlers.indexOf(handler as unknown as any);

      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  };
}

type RegisterComponentFunction<ThreadContext extends BaseThreadContext> = (ctx: ThreadContext) => void;

export interface Config<ThreadContext extends BaseThreadContext> {
  modules: Module<ThreadContext, any>[];
  systems: ThreadSystem<ThreadContext>[];
  components?: RegisterComponentFunction<ThreadContext>[];
}

export function defineConfig<ThreadContext extends BaseThreadContext>(
  config: Config<ThreadContext>
): Config<ThreadContext> {
  return config;
}
