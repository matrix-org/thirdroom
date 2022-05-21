export type ThreadSystem<ThreadContext extends BaseThreadContext> = (ctx: ThreadContext) => void;

export interface BaseThreadContext {
  systems: ThreadSystem<any>[];
  scopes: Map<ScopeFactory<any, any>, any>;
  messageHandlers: Map<string, MessageHandler<any, string, Message<any>>[]>;
}

export type ScopeFactory<ThreadContext extends BaseThreadContext, ScopeState> = (ctx: ThreadContext) => ScopeState;

export function getScope<ThreadContext extends BaseThreadContext, Scope>(
  threadContext: ThreadContext,
  scopeFactory: ScopeFactory<ThreadContext, Scope>
): Scope {
  let scopeState = threadContext.scopes.get(scopeFactory);

  if (!scopeState) {
    scopeState = scopeFactory(threadContext);
    threadContext.scopes.set(scopeFactory, scopeState);
  }

  return scopeState;
}

export type Module<ThreadContext extends BaseThreadContext> = (
  ctx: ThreadContext
) => void | (() => void) | Promise<void> | Promise<() => void>;

export async function registerModules<ThreadContext extends BaseThreadContext>(
  context: ThreadContext,
  modules: Module<ThreadContext>[]
) {
  const moduleDisposeFunctions: (() => void)[] = [];

  for (const module of modules) {
    const result = module(context);

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

export function registerSystem<ThreadContext extends BaseThreadContext>(
  ctx: ThreadContext,
  system: ThreadSystem<ThreadContext>
) {
  ctx.systems.push(system);

  return () => {
    const index = ctx.systems.indexOf(system);

    if (index !== -1) {
      ctx.systems.splice(index, 1);
    }
  };
}
