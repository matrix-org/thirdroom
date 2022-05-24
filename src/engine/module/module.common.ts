export type ThreadSystem<ThreadContext extends BaseThreadContext> = (ctx: ThreadContext) => void;

export interface BaseThreadContext {
  systems: Map<ThreadSystem<any>, boolean>;
  modules: Map<Module<any, any, any>, any>;
  messageHandlers: Map<string, MessageHandler<any, string, Message<any>>[]>;
}

export function getModule<ThreadContext extends BaseThreadContext, InitialState extends {}, ModuleState extends {}>(
  threadContext: ThreadContext,
  module: Module<ThreadContext, InitialState, ModuleState>
): ModuleState {
  return threadContext.modules.get(module);
}

export interface Module<ThreadContext extends BaseThreadContext, InitialState extends {}, ModuleState extends {}> {
  create: ((initialState: InitialState) => ModuleState) | ((initialState: InitialState) => Promise<ModuleState>);
  init: (ctx: ThreadContext) => void | (() => void) | Promise<void> | Promise<() => void>;
}

export function defineModule<ThreadContext extends BaseThreadContext, InitialState extends {}, ModuleState extends {}>(
  moduleDef: Module<ThreadContext, InitialState, ModuleState>
) {
  return moduleDef;
}

export async function registerModules<ThreadContext extends BaseThreadContext>(
  initialState: any,
  context: ThreadContext,
  modules: Module<ThreadContext, {}, {}>[]
) {
  const moduleDisposeFunctions: (() => void)[] = [];

  const createPromises = modules.map((module) => {
    const result = module.create(initialState);

    if (result.hasOwnProperty("then")) {
      return result;
    } else {
      return Promise.resolve(result);
    }
  });

  const moduleStates = await Promise.all(createPromises);

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
  modules: Module<ThreadContext, any, any>[];
  systems: ThreadSystem<ThreadContext>[];
  components?: RegisterComponentFunction<ThreadContext>[];
}

export function defineConfig<ThreadContext extends BaseThreadContext>(
  config: Config<ThreadContext>
): Config<ThreadContext> {
  return config;
}
