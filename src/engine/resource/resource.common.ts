import { getReadBufferIndexFromFlags, TripleBuffer } from "../allocator/TripleBuffer";
import { defineModule, Thread, getModule, BaseThreadContext } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import {
  ILocalResourceManager,
  ResourceDefinition,
  LocalResourceTypes,
  ILocalResourceConstructor,
} from "./ResourceDefinition";
import { LocalResource } from "./ResourceDefinition";
import { defineLocalResourceClass } from "./LocalResourceClass";
import { createMessageQueueConsumer } from "./MessageQueue";
import {
  createObjectTripleBuffer,
  defineObjectBufferSchema,
  getReadObjectBufferView,
  getWriteObjectBufferView,
  ObjectTripleBuffer,
} from "../allocator/ObjectBufferView";
import { ResourceRingBuffer, drainResourceRingBuffer, ResourceCommand } from "./DisposeResourceRingBuffer";

export enum LoadStatus {
  Uninitialized,
  Loading,
  Loaded,
  Error,
  Disposed,
}

export type ResourceId = number;

export const StringResourceType = "string";
export const ArrayBufferResourceType = "arrayBuffer";

export enum ResourceMessageType {
  InitGameResourceModule = "init-game-resource-module",
  InitRemoteResourceModule = "init-remote-resource-module",
  LoadResources = "load-resources",
}

export const fromGameResourceModuleStateSchema = defineObjectBufferSchema({
  tick: [Uint32Array, 1],
});

export const toGameResourceModuleStateSchema = defineObjectBufferSchema({
  lastProcessedTick: [Uint32Array, 1],
});

export type FromGameResourceModuleStateTripleBuffer = ObjectTripleBuffer<typeof fromGameResourceModuleStateSchema>;
export type ToGameResourceModuleStateTripleBuffer = ObjectTripleBuffer<typeof toGameResourceModuleStateSchema>;

export interface InitGameResourceModuleMessage {
  fromGameState: FromGameResourceModuleStateTripleBuffer;
  disposedResources: ResourceRingBuffer;
  toGameStateTripleBufferFlags: Uint8Array;
  fromGameStateTripleBufferFlags: Uint8Array;
}

export interface InitRemoteResourceModuleMessage {
  toGameState: ToGameResourceModuleStateTripleBuffer;
}

export type ResourceProps = SharedArrayBuffer | string | TripleBuffer;

export interface CreateResourceMessage {
  resourceType: string;
  id: number;
  props: ResourceProps;
}

export interface LoadResourcesMessage {
  type: ResourceMessageType.LoadResources;
  resources: CreateResourceMessage[];
}

interface LocalResourceInfo {
  id: number;
  resourceType: string;
  disposed: boolean;
}

export type RegisterResourceLoaderFunction<ThreadContext extends BaseThreadContext> = (
  ctx: ThreadContext,
  resourceType: string,
  resourceLoader: ResourceLoader<ThreadContext>
) => () => void;

export type ResourceLoader<ThreadContext extends BaseThreadContext> = (
  ctx: ThreadContext,
  id: ResourceId,
  props: ResourceProps
) => LocalResourceTypes;

interface ResourceModuleState<ThreadContext extends BaseThreadContext> {
  resources: Map<ResourceId, LocalResourceTypes>;
  resourceInfos: Map<ResourceId, LocalResourceInfo>;
  resourcesByType: Map<string, LocalResourceTypes[]>;
  resourceLoaders: Map<string, ResourceLoader<ThreadContext>>;
  fromGameState: FromGameResourceModuleStateTripleBuffer;
  toGameState: ToGameResourceModuleStateTripleBuffer;
  disposedResources: ResourceRingBuffer;
  createResourceMap: Map<ResourceId, number>;
  fromGameStateTripleBufferFlags: Uint8Array;
  resourceManager: ILocalResourceManager;
}

export class ResourceDisposedError extends Error {}

export const createLocalResourceModule = <ThreadContext extends BaseThreadContext>(
  resourceDefinitions: ILocalResourceConstructor<ThreadContext>[]
) => {
  const [drainResourceMessages, registerResourceMessageHandler] = createMessageQueueConsumer<
    ThreadContext,
    CreateResourceMessage
  >(ResourceMessageType.LoadResources);

  const ResourceModule = defineModule<ThreadContext, ResourceModuleState<ThreadContext>>({
    name: "resource",
    async create(ctx, { waitForMessage, sendMessage }) {
      const { fromGameStateTripleBufferFlags, fromGameState, toGameStateTripleBufferFlags, disposedResources } =
        await waitForMessage<InitGameResourceModuleMessage>(Thread.Game, ResourceMessageType.InitGameResourceModule);

      const toGameState = createObjectTripleBuffer(toGameResourceModuleStateSchema, toGameStateTripleBufferFlags);

      sendMessage<InitRemoteResourceModuleMessage>(Thread.Game, ResourceMessageType.InitRemoteResourceModule, {
        toGameState,
      });

      const resources = new Map();

      const resourceManager: ILocalResourceManager = {
        resources: resources,
        readBufferIndex: getReadBufferIndexFromFlags(fromGameStateTripleBufferFlags),
      };

      return {
        resources,
        resourceInfos: new Map(),
        resourcesByType: new Map(),
        resourceLoaders: new Map(),
        fromGameState,
        toGameState,
        disposedResources,
        createResourceMap: new Map(),
        fromGameStateTripleBufferFlags,
        resourceManager,
      };
    },
    init(ctx) {
      return createDisposables([
        ...resourceDefinitions.map((def) => registerResource(ctx, def)),
        registerResourceLoader(ctx, StringResourceType, onLoadStringResource),
        registerResourceLoader(ctx, ArrayBufferResourceType, onLoadArrayBufferResource),
        registerResourceMessageHandler(ctx),
      ]);
    },
  });

  function registerResource(ctx: ThreadContext, resourceDefOrClass: ILocalResourceConstructor<ThreadContext>) {
    const resourceModule = getModule(ctx, ResourceModule);

    const dependencyByteOffsets: number[] = [];
    const dependencyNames: string[] = [];

    const LocalResourceClass =
      "resourceDef" in resourceDefOrClass ? resourceDefOrClass : defineLocalResourceClass(resourceDefOrClass);

    const resourceDef = LocalResourceClass.resourceDef;

    for (const propName in resourceDef.schema) {
      const prop = resourceDef.schema[propName];

      if (prop.backRef) {
        continue;
      }

      if (prop.type === "string" || prop.type === "ref" || prop.type === "refArray" || prop.type === "refMap") {
        for (let i = 0; i < prop.size; i++) {
          dependencyByteOffsets.push(prop.byteOffset + i * prop.arrayType.BYTES_PER_ELEMENT);
          dependencyNames.push(propName);
        }
      } else if (prop.type === "arrayBuffer") {
        dependencyByteOffsets.push(prop.byteOffset + Uint32Array.BYTES_PER_ELEMENT);
        dependencyNames.push(propName);
      }
    }

    function loadLocalResource(
      ctx: ThreadContext,
      resourceId: number,
      tripleBuffer: ResourceProps
    ): LocalResource<ThreadContext> {
      const resourceModule = getModule(ctx, ResourceModule);
      const resource = new LocalResourceClass(resourceModule.resourceManager, resourceId, tripleBuffer as TripleBuffer);
      resource.load(ctx);
      return resource as LocalResource<ThreadContext>;
    }

    resourceModule.resourceLoaders.set(resourceDef.name, loadLocalResource);

    return () => {
      resourceModule.resourceLoaders.delete(resourceDef.name);
    };
  }

  function registerResourceLoader(
    ctx: ThreadContext,
    resourceType: string,
    resourceLoader: ResourceLoader<ThreadContext>
  ) {
    const resourceModule = getModule(ctx, ResourceModule);
    resourceModule.resourceLoaders.set(resourceType, resourceLoader);

    return () => {
      resourceModule.resourceLoaders.delete(resourceType);
    };
  }

  function onLoadStringResource<ThreadContext extends BaseThreadContext>(
    ctx: ThreadContext,
    id: ResourceId,
    props: ResourceProps
  ): string {
    return props as string;
  }

  function onLoadArrayBufferResource<ThreadContext extends BaseThreadContext>(
    ctx: ThreadContext,
    id: ResourceId,
    props: ResourceProps
  ): SharedArrayBuffer {
    return props as SharedArrayBuffer;
  }

  function ResourceLoaderSystem(ctx: ThreadContext) {
    const resourceModule = getModule(ctx, ResourceModule);
    const createResourceMap = resourceModule.createResourceMap;

    resourceModule.resourceManager.readBufferIndex = getReadBufferIndexFromFlags(
      resourceModule.fromGameStateTripleBufferFlags
    );

    const { tick } = getReadObjectBufferView(resourceModule.fromGameState);

    for (const [command, eid] of drainResourceRingBuffer(resourceModule.disposedResources, tick[0])) {
      const curCount = createResourceMap.get(eid) || 0;

      if (command === ResourceCommand.Create) {
        createResourceMap.set(eid, curCount + 1);
      } else if (command === ResourceCommand.Dispose) {
        disposeResource(ctx, resourceModule, eid);
        createResourceMap.set(eid, curCount - 1);
      }
    }

    for (const message of drainResourceMessages()) {
      const eid = message.id;
      const curCount = createResourceMap.get(eid) || 0;

      if (curCount === 1) {
        loadResource(ctx, resourceModule, message);
      }
    }

    const { lastProcessedTick } = getWriteObjectBufferView(resourceModule.toGameState);
    lastProcessedTick[0] = tick[0];
  }

  function loadResource(
    ctx: ThreadContext,
    resourceModule: ResourceModuleState<ThreadContext>,
    resourceMessage: CreateResourceMessage
  ) {
    const { id, resourceType, props } = resourceMessage;

    if (resourceModule.resourceInfos.has(id)) {
      throw new Error(`Resource ${id} already exists`);
    }

    const resourceInfo: LocalResourceInfo = {
      id,
      resourceType,
      disposed: false,
    };

    resourceModule.resourceInfos.set(id, resourceInfo);

    const resourceLoader = resourceModule.resourceLoaders.get(resourceType);

    if (!resourceLoader) {
      throw new Error(`No registered resource loader for ${resourceType}`);
    }

    const resource = resourceLoader(ctx, id, props);

    resourceModule.resources.set(id, resource);

    let resourceArr = resourceModule.resourcesByType.get(resourceType);

    if (!resourceArr) {
      resourceArr = [];
      resourceModule.resourcesByType.set(resourceType, resourceArr);
    }

    resourceArr.push(resource);
  }

  function disposeResource(ctx: ThreadContext, resourceModule: ResourceModuleState<ThreadContext>, resourceId: number) {
    const { resourceInfos, resources, resourcesByType } = resourceModule;

    const resourceInfo = resourceInfos.get(resourceId);

    if (resourceInfo) {
      const resource = resources.get(resourceId);

      if (resource) {
        const resourceArr = resourcesByType.get(resourceInfo.resourceType);

        if (resourceArr) {
          const index = resourceArr.indexOf(resource);

          if (index !== -1) {
            resourceArr.splice(index, 1);
          }
        }

        if (typeof resource !== "string" && "dispose" in resource) {
          resource.dispose(ctx);
        }
      }

      resourceInfo.disposed = true;

      resourceInfos.delete(resourceId);

      return true;
    } else {
      return false;
    }
  }

  function getLocalResource<Resource extends LocalResourceTypes>(
    ctx: ThreadContext,
    resourceId: ResourceId
  ): Resource | undefined {
    const resourceModule = getModule(ctx, ResourceModule);
    return resourceModule.resources.get(resourceId) as Resource | undefined;
  }

  function getLocalResources<Def extends ResourceDefinition, T extends LocalResource>(
    ctx: ThreadContext,
    resourceDefOrClass:
      | Def
      | { new (manager: ILocalResourceManager, resourceId: number, tripleBuffer: TripleBuffer): T; resourceDef: Def }
  ): T[] {
    const resourceModule = getModule(ctx, ResourceModule);
    const resourceDef = "resourceDef" in resourceDefOrClass ? resourceDefOrClass.resourceDef : resourceDefOrClass;
    return (resourceModule.resourcesByType.get(resourceDef.name) || []) as T[];
  }

  return {
    ResourceModule,
    registerResource,
    registerResourceLoader,
    getLocalResource,
    getLocalResources,
    ResourceLoaderSystem,
  };
};
