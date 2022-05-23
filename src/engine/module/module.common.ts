export type ThreadSystem<ThreadContext extends BaseThreadContext> = (ctx: ThreadContext) => void;

interface SystemGraphNode {
  system: ThreadSystem<any>;
  before?: ThreadSystem<any>[];
  after?: ThreadSystem<any>[];
}

export interface BaseThreadContext {
  systemGraphChanged: boolean;
  systemGraph: SystemGraphNode[];
  systems: ThreadSystem<any>[];
  modules: Map<Module<any, any, any>, any>;
  messageHandlers: Map<string, MessageHandler<any, string, Message<any>>[]>;
}

export function getModule<ThreadContext extends BaseThreadContext, InitialState extends {}, ModuleState extends {}>(
  threadContext: ThreadContext,
  module: Module<ThreadContext, InitialState, ModuleState>
): ModuleState {
  return threadContext.modules.get(module);
}

interface Module<ThreadContext extends BaseThreadContext, InitialState extends {}, ModuleState extends {}> {
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

interface RegisterSystemOptions<ThreadContext extends BaseThreadContext> {
  before?: ThreadSystem<ThreadContext>[];
  after?: ThreadSystem<ThreadContext>[];
}

export function registerSystem<ThreadContext extends BaseThreadContext>(
  ctx: ThreadContext,
  system: ThreadSystem<ThreadContext>,
  options?: RegisterSystemOptions<ThreadContext>
) {
  ctx.systemGraphChanged = true;
  ctx.systemGraph.push({
    system,
    before: options?.before,
    after: options?.after,
  });

  return () => {
    ctx.systemGraphChanged = true;

    const index = ctx.systemGraph.findIndex((node) => node.system === system);

    if (index !== -1) {
      ctx.systemGraph.splice(index, 1);
    }
  };
}

export function updateSystemOrder<ThreadContext extends BaseThreadContext>(
  ctx: ThreadContext
): ThreadSystem<ThreadContext>[] {
  // TODO: Implement this
  // if (ctx.systemGraphChanged) {

  //   const workingNodes = ctx.systemGraph.map((item) => ({ ...item }));
  //   let depCount = 0;
  //   let systemsLeft = ctx.systems.length;
  //   let lastSystemsLeft = systemsLeft;

  //   ctx.systems.length = 0;

  //   while (systemsLeft > 0) {
  //     for (const node of workingNodes) {
  //       if ((node.after?.length || 0) + (node.before?.length || 0) === depCount) {
  //         systemsLeft--;
  //       }
  //     }

  //     if (systemsLeft === lastSystemsLeft) {
  //       throw new Error("Invalid system dependencies.");
  //     }

  //     lastSystemsLeft = systemsLeft;
  //     depCount++;
  //   }
  // }

  if (ctx.systemGraphChanged) {
    ctx.systems.length = 0;

    for (let i = 0; i < ctx.systemGraph.length; i++) {
      ctx.systems.push(ctx.systemGraph[i].system);
    }
  }

  return ctx.systems;
}
