export type ThreadSystem<ThreadContext extends BaseThreadContext> = (ctx: ThreadContext) => void;

export interface SingleConsumerThreadSharedState {
  useXRViewerWorldMatrix: boolean;
  xrViewerWorldMatrix: Float32Array;
  update: () => void;
}

export interface ConsumerThreadContext extends BaseThreadContext {
  isStaleFrame: boolean;
  singleConsumerThreadSharedState?: SingleConsumerThreadSharedState;
}

export interface BaseThreadContext {
  thread: Thread;
  tick: number;
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
  // todo: throw if module doesn't exist?
  return threadContext.modules.get(module);
}

export enum Thread {
  Main = "main",
  Game = "game",
  Render = "render",
  Shared = "shared",
}

export interface ModuleLoader {
  sendMessage<Data>(thread: Thread, key: string, data: Data, transferList?: (Transferable | OffscreenCanvas)[]): void;
  waitForMessage<Data>(thread: Thread, key: string): Promise<Data>;
}

enum ModuleLoaderMessage {
  ModuleList = "ModuleList",
  CreateModule = "CreateModule",
  ModuleCreated = "ModuleCreated",
  ModuleCreationFinished = "ModuleCreationFinished",
  ModulesInitialized = "ModulesInitialized",
  Complete = "Complete",
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

export async function registerModules<ThreadContext extends BaseThreadContext>(
  thread: Thread,
  context: ThreadContext,
  modules: Module<ThreadContext, {}>[]
) {
  const { dispose, sendQueuedMessage, waitForQueuedMessage, handleQueuedMessages } = registerQueuedMessageHandler(
    thread,
    context,
    "module-loader"
  );

  const createLoaderContext = (moduleName: string): ModuleLoader => ({
    sendMessage: sendQueuedMessage,
    waitForMessage: waitForQueuedMessage,
  });

  async function loadModule(module: Module<ThreadContext, any>) {
    const result = module.create(context, createLoaderContext(module.name));
    const moduleState = result instanceof Promise ? await result : result;
    context.modules.set(module, moduleState);
  }

  if (thread === Thread.Main) {
    // Wait for module list from each thread
    const mainThreadModules = modules.map((module) => module.name);

    const [renderThreadModules, gameThreadModules] = await Promise.all([
      waitForQueuedMessage<string[]>(Thread.Render, ModuleLoaderMessage.ModuleList),
      waitForQueuedMessage<string[]>(Thread.Game, ModuleLoaderMessage.ModuleList),
    ]);

    const sortedModules = Array.from(
      new Set([...mainThreadModules, ...renderThreadModules, ...gameThreadModules])
    ).sort();

    for (const moduleName of sortedModules) {
      const promises: Promise<void>[] = [];

      const mainThreadModule = modules.find((m) => m.name === moduleName);

      if (mainThreadModule) {
        promises.push(loadModule(mainThreadModule));
      }

      if (renderThreadModules.includes(moduleName)) {
        sendQueuedMessage(Thread.Render, ModuleLoaderMessage.CreateModule, moduleName);
        promises.push(waitForQueuedMessage(Thread.Render, ModuleLoaderMessage.ModuleCreated));
      }

      if (gameThreadModules.includes(moduleName)) {
        sendQueuedMessage(Thread.Game, ModuleLoaderMessage.CreateModule, moduleName);
        promises.push(waitForQueuedMessage(Thread.Game, ModuleLoaderMessage.ModuleCreated));
      }

      await Promise.all(promises);
    }

    sendQueuedMessage(Thread.Render, ModuleLoaderMessage.ModuleCreationFinished);
    sendQueuedMessage(Thread.Game, ModuleLoaderMessage.ModuleCreationFinished);
  } else {
    // Send module list to main thread and wait for response

    const disposeHandler = handleQueuedMessages<string>(
      Thread.Main,
      ModuleLoaderMessage.CreateModule,
      async (moduleName) => {
        const module = modules.find((module) => module.name === moduleName);

        if (!module) {
          throw new Error(`Module ${moduleName} not found on thread ${thread}`);
        }

        await loadModule(module);

        sendQueuedMessage(Thread.Main, ModuleLoaderMessage.ModuleCreated);
      }
    );

    sendQueuedMessage(
      Thread.Main,
      ModuleLoaderMessage.ModuleList,
      modules.map((module) => module.name)
    );

    await waitForQueuedMessage(Thread.Main, ModuleLoaderMessage.ModuleCreationFinished);

    disposeHandler();
  }

  const moduleDisposeFunctions: (() => void)[] = [];

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

  if (thread === Thread.Main) {
    await Promise.all([
      waitForQueuedMessage(Thread.Render, ModuleLoaderMessage.ModulesInitialized),
      waitForQueuedMessage(Thread.Game, ModuleLoaderMessage.ModulesInitialized),
    ]);

    sendQueuedMessage(Thread.Render, ModuleLoaderMessage.Complete);
    sendQueuedMessage(Thread.Game, ModuleLoaderMessage.Complete);
  } else {
    sendQueuedMessage(Thread.Main, ModuleLoaderMessage.ModulesInitialized);

    await waitForQueuedMessage(Thread.Main, ModuleLoaderMessage.Complete);
  }

  dispose();

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

interface QueuedMessage<MessageType extends string = string, Key extends string = string, Data = unknown>
  extends Message<MessageType> {
  fromThread: Thread;
  key: Key;
  data?: Data;
}

interface DeferredMessage<Key extends string = string> {
  fromThread: Thread;
  key: Key;
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  timeoutId: number;
}

interface QueuedMessageHandler {
  fromThread: Thread;
  key: string;
  callback: (data?: any) => void;
}

function registerQueuedMessageHandler<ThreadContext extends BaseThreadContext, MessageType extends string>(
  localThread: Thread,
  context: ThreadContext,
  type: MessageType
) {
  const deferredMessages: DeferredMessage[] = [];
  const messageQueue: QueuedMessage<MessageType, string, any>[] = [];
  const messageHandlers: QueuedMessageHandler[] = [];

  const dispose = registerMessageHandler<ThreadContext, MessageType, QueuedMessage<MessageType, string, unknown>>(
    context,
    type,
    (_, message) => {
      const deferredIndex = deferredMessages.findIndex(
        (deferredMessage) => deferredMessage.key === message.key && deferredMessage.fromThread === message.fromThread
      );

      const deferred = deferredMessages[deferredIndex];

      if (deferred) {
        clearTimeout(deferred.timeoutId);
        deferredMessages.splice(deferredIndex, 1);
        deferred.resolve(message.data);
        return;
      }

      const messageHandler = messageHandlers.find(
        (handler) => handler.key === message.key && handler.fromThread === message.fromThread
      );

      if (messageHandler) {
        messageHandler.callback(message.data);
        return;
      }

      messageQueue.push(message);
    }
  );

  function sendQueuedMessage(
    toThread: Thread,
    key: string,
    data?: unknown,
    transferList?: (Transferable | OffscreenCanvas)[]
  ) {
    context.sendMessage<QueuedMessage<MessageType, string, unknown>>(
      toThread,
      { type, fromThread: localThread, key, data },
      transferList
    );
  }

  function waitForQueuedMessage<Data = unknown>(fromThread: Thread, key: string): Promise<Data> {
    const index = messageQueue.findIndex((message) => message.key === key && message.fromThread === fromThread);

    if (index !== -1) {
      const message = messageQueue[index];
      messageQueue.splice(index, 1);
      return Promise.resolve(message.data as Data);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = self.setTimeout(() => {
        reject(
          new Error(
            `timeout reached while waiting on message ${key} from thread ${fromThread} on thread ${localThread}`
          )
        );
      }, 30000);
      const msg = { fromThread, key, resolve, reject, timeoutId };
      deferredMessages.push(msg);
    });
  }

  function handleQueuedMessages<Data = unknown>(
    fromThread: Thread,
    key: string,
    callback: (data: Data) => void
  ): () => void {
    const initialMessages = messageQueue.filter((message) => message.fromThread === fromThread && message.key === key);

    for (const message of initialMessages) {
      callback(message.data);
    }

    const messageHandler = {
      fromThread,
      key,
      callback,
    };

    messageHandlers.push(messageHandler);

    return () => {
      const index = messageHandlers.indexOf(messageHandler);

      if (index !== -1) {
        messageHandlers.splice(index, 1);
      }
    };
  }

  return {
    dispose,
    waitForQueuedMessage,
    sendQueuedMessage,
    handleQueuedMessages,
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
