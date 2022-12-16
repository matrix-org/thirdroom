import { copyToWriteBuffer, createTripleBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { ScriptWebAssemblyInstance } from "../scripting/scripting.game";
import { defineRemoteResourceClass, IRemoteResourceClass } from "./RemoteResourceClass";
import { ResourceId } from "./resource.common";
import {
  addResourceRef,
  createArrayBufferResource,
  createResource,
  createStringResource,
  disposeResource,
  getRemoteResource,
  setRemoteResource,
} from "./resource.game";
import { InitialResourceProps, IRemoteResourceManager, RemoteResource, ResourceDefinition } from "./ResourceDefinition";
import { decodeString } from "./strings";

interface ResourceTransformData {
  writeView: Uint8Array;
  refView: Uint32Array;
  refOffsets: number[];
  refIsString: boolean[];
}

interface ScriptResourceStore {
  refView: Uint32Array;
  prevRefs: number[];
}

export class ScriptResourceManager implements IRemoteResourceManager {
  public memory: WebAssembly.Memory;
  public buffer: ArrayBuffer | SharedArrayBuffer;
  public U8Heap: Uint8Array;
  public U32Heap: Uint32Array;
  private textDecoder = new TextDecoder();
  private textEncoder = new TextEncoder();
  private instance?: ScriptWebAssemblyInstance;

  // When allocating resource, allocate space in WASM memory and a triplebuffer
  // At end of frame copy each resource to triple buffer using ptr and byteLength
  // Replace ptrs with resource ids
  // Other threads use resource ids to look up associated resources

  // For the global resource manager, we always use resource ids
  // This means the the ScriptResourceManager is only different on the Game Thread

  // Strings are allocated on a single shared buffer. They are assumed to be immutable.
  // In the same way we check to see if the string ptr has changed before we decode it
  // we should
  private ctx: GameState;
  private resourceDefByType: Map<number, ResourceDefinition> = new Map();
  private resourceConstructors: Map<ResourceDefinition, IRemoteResourceClass<ResourceDefinition>> = new Map();
  private resourceTransformData: Map<number, ResourceTransformData> = new Map();
  private ptrToResourceId: Map<number, number> = new Map();
  private resourceStorage: Map<number, ScriptResourceStore> = new Map();
  public resources: RemoteResource<ResourceDefinition>[] = [];

  constructor(ctx: GameState, allowedResources: ResourceDefinition[]) {
    this.ctx = ctx;
    this.memory = new WebAssembly.Memory({ initial: 1024, maximum: 1024 });
    this.buffer = this.memory.buffer;
    this.U8Heap = new Uint8Array(this.buffer);
    this.U32Heap = new Uint32Array(this.buffer);

    for (const resourceDef of allowedResources) {
      this.registerResource(resourceDef);
    }
  }

  setInstance(instance: ScriptWebAssemblyInstance): void {
    this.instance = instance;
  }

  registerResource<Def extends ResourceDefinition>(resourceDef: Def) {
    this.resourceDefByType.set(resourceDef.resourceType, resourceDef);
    const resourceConstructor = defineRemoteResourceClass<Def>(resourceDef);
    this.resourceConstructors.set(
      resourceDef,
      resourceConstructor as unknown as IRemoteResourceClass<ResourceDefinition>
    );

    const buffer = new ArrayBuffer(resourceDef.byteLength);
    const writeView = new Uint8Array(buffer);
    const refView = new Uint32Array(buffer);
    const refOffsets: number[] = [];
    const refIsString: boolean[] = [];

    const schema = resourceDef.schema;

    for (const propName in schema) {
      const prop = schema[propName];

      if (prop.type === "ref" || prop.type === "refArray" || prop.type === "refMap" || prop.type === "string") {
        for (let i = 0; i < prop.size; i++) {
          refOffsets.push(prop.byteOffset + i * prop.arrayType.BYTES_PER_ELEMENT);
          refIsString.push(prop.type === "string");
        }
      } else if (prop.type === "arrayBuffer") {
        refOffsets.push(prop.byteOffset + Uint32Array.BYTES_PER_ELEMENT);
        refIsString.push(false);
      }
    }

    this.resourceTransformData.set(resourceDef.resourceType, {
      writeView,
      refView,
      refOffsets,
      refIsString,
    });
  }

  createResource<Def extends ResourceDefinition>(
    resourceDef: Def,
    props: InitialResourceProps<Def>
  ): RemoteResource<Def> {
    const resourceConstructor = this.resourceConstructors.get(resourceDef) as IRemoteResourceClass<Def> | undefined;

    if (!resourceConstructor) {
      throw new Error(`Resource "${resourceDef.name}" not registered with ScriptResourceManager.`);
    }

    const buffer = this.memory.buffer;
    const ptr = this.allocate(resourceDef.byteLength);
    const tripleBuffer = createTripleBuffer(this.ctx.gameToRenderTripleBufferFlags, resourceDef.byteLength);
    const resource = new resourceConstructor(this, buffer, ptr, tripleBuffer, props);
    const resourceId = createResource(this.ctx, Thread.Shared, resourceDef.name, tripleBuffer);
    resource.resourceId = resourceId;
    setRemoteResource(this.ctx, resourceId, resource);
    this.ptrToResourceId.set(ptr, resourceId);
    this.resources.push(resource as unknown as RemoteResource<ResourceDefinition>);
    this.resourceStorage.set(resourceId, {
      refView: new Uint32Array(buffer, ptr, resourceDef.byteLength),
      prevRefs: [],
    });
    return resource;
  }

  getResource<Def extends ResourceDefinition>(
    resourceDef: Def,
    resourceId: ResourceId
  ): RemoteResource<Def> | undefined {
    return getRemoteResource<RemoteResource<Def>>(this.ctx, resourceId);
  }

  disposeResource(resourceId: number): void {
    const index = this.resources.findIndex((resource) => resource.resourceId === resourceId);

    if (index === -1) {
      return;
    }

    const resource = this.resources[index];

    const { refOffsets } = this.resourceTransformData.get(resource.resourceType)!;
    const resourceStore = this.resourceStorage.get(resource.resourceId)!;

    for (let i = 0; i < refOffsets.length; i++) {
      const refOffset = refOffsets[i];
      const refPtr = resourceStore.refView[refOffset];

      if (refPtr) {
        const resourceId = this.ptrToResourceId.get(refPtr);

        if (resourceId) {
          disposeResource(this.ctx, resourceId);
        }
      }
    }

    this.deallocate(resource.ptr);

    this.ptrToResourceId.delete(resource.ptr);
    this.resources.splice(index, 1);
    this.resourceStorage.delete(resourceId);
  }

  getString(store: Uint32Array): string {
    const resourceId = this.ptrToResourceId.get(store[0]);
    return getRemoteResource<string>(this.ctx, resourceId!)!;
  }

  setString(value: string, store: Uint32Array): void {
    if (store[0]) {
      this.deallocate(store[0]);
    }

    const arr = this.textEncoder.encode(value);
    const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
    nullTerminatedArr.set(arr);

    const ptr = this.allocate(nullTerminatedArr.byteLength);
    this.U8Heap.set(nullTerminatedArr, ptr);
    store[0] = ptr;

    const resourceId = createStringResource(this.ctx, value);
    addResourceRef(this.ctx, resourceId);
    this.ptrToResourceId.set(ptr, resourceId);
  }

  getArrayBuffer(store: Uint32Array): SharedArrayBuffer {
    if (!store[1]) {
      throw new Error("arrayBuffer field not initialized.");
    }

    const resourceId = this.ptrToResourceId.get(store[1]);
    return getRemoteResource<SharedArrayBuffer>(this.ctx, resourceId!)!;
  }

  setArrayBuffer(value: SharedArrayBuffer, store: Uint32Array): void {
    if (store[1]) {
      throw new Error("You cannot mutate an existing arrayBuffer field.");
    }

    // TODO: Add a function to actually get a range of buffer data in script context
    // We shouldn't allocate all the buffer data on the script heap because if you aren't using it,
    // it's a waste of memory.
    store[0] = value.byteLength;
    const ptr = this.allocate(value.byteLength);
    const bufView = new Uint8Array(value);
    this.U8Heap.set(bufView, ptr);
    store[1] = ptr;
    const resourceId = createArrayBufferResource(this.ctx, value);
    addResourceRef(this.ctx, resourceId);
    this.ptrToResourceId.set(ptr, resourceId);
  }

  getRef<Def extends ResourceDefinition>(resourceDef: Def, store: Uint32Array): RemoteResource<Def> | undefined {
    const resourceId = this.ptrToResourceId.get(store[0]);
    return getRemoteResource<RemoteResource<Def>>(this.ctx, resourceId!);
  }

  setRef(value: RemoteResource<ResourceDefinition> | undefined, store: Uint32Array): void {
    // if (store[0]) {
    //   const prevResourceId = this.ptrToResourceId.get(store[0]);

    //   if (prevResourceId) {
    //     disposeResource(this.ctx, prevResourceId);
    //   }
    // }

    if (value) {
      addResourceRef(this.ctx, value.resourceId);
      store[0] = value.ptr;
    } else {
      store[0] = 0;
    }
  }

  addRef(resourceId: number) {
    addResourceRef(this.ctx, resourceId);
  }

  removeRef(resourceId: number) {
    disposeResource(this.ctx, resourceId);
  }

  /**
   * After the script has finished running its update method we need to copy resource
   * data into the triple buffer to go to the other threads. However, the resources
   * store refs as pointers within the WASM heap. So we need to translate those to
   * resource ids. In addition we need strings and arraybuffers to exist on the other threads.
   */
  commitResources() {
    const resources = this.resources;

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const { writeView, refView, refOffsets, refIsString } = this.resourceTransformData.get(resource.resourceType)!;
      const resourceStore = this.resourceStorage.get(resource.resourceId)!;

      writeView.set(resource.byteView);

      for (let j = 0; j < refOffsets.length; j++) {
        const refOffset = refOffsets[j] / Uint32Array.BYTES_PER_ELEMENT;
        const nextRefPtr = resourceStore.refView[refOffset];
        const prevRefPtr = resourceStore.prevRefs[j];
        let nextResourceId = this.ptrToResourceId.get(nextRefPtr);

        if (nextRefPtr !== prevRefPtr && refIsString[j]) {
          const prevResourceId = this.ptrToResourceId.get(prevRefPtr);

          if (prevResourceId) {
            // TODO: Dispose non-string resources automatically when they are no longer referenced?
            disposeResource(this.ctx, prevResourceId);
          }

          resourceStore.prevRefs[j] = nextRefPtr;

          if (!nextResourceId) {
            nextResourceId = createStringResource(this.ctx, decodeString(nextRefPtr, this.U8Heap));
          }
        }

        // if (resource.resourceType === ResourceType.Material && resource.name === "Default") {
        //   console.log(resource.name, nextResourceId);
        // }

        refView[refOffset] = nextResourceId || 0;
      }

      if (resource.initialized) {
        copyToWriteBuffer(resource.tripleBuffer, writeView);
      } else {
        const tripleBufferByteViews = resource.tripleBuffer.byteViews;
        tripleBufferByteViews[0].set(writeView);
        tripleBufferByteViews[1].set(writeView);
        tripleBufferByteViews[2].set(writeView);
        resource.initialized = true;
      }
    }
  }

  allocate(byteLength: number): number {
    if (!this.instance) {
      throw new Error("Called allocate before instance was set.");
    }

    return this.instance.exports.websg_allocate(byteLength);
  }

  deallocate(ptr: number): void {
    if (!this.instance) {
      throw new Error("Called deallocate before instance was set.");
    }

    this.instance.exports.websg_deallocate(ptr);
  }

  createImports(): WebAssembly.Imports {
    return {
      env: {
        memory: this.memory,
      },
      thirdroom: {
        enable_matrix_material: (enabled: number) => {
          this.ctx.sendMessage(Thread.Render, {
            type: "enable-matrix-material",
            enabled: !!enabled,
          });
        },
      },
      websg: {
        get_resource_by_name: (resourceType: number, namePtr: number) => {
          const resources = this.resources;
          const name = decodeString(namePtr, this.U8Heap);

          for (let i = 0; i < resources.length; i++) {
            const resource = resources[i];
            const def = resource.constructor.resourceDef;

            if (def.resourceType === resourceType && resource.name === name) {
              return resource.ptr;
            }
          }

          return 0;
        },
        create_resource: (type: number, ptr: number) => {
          const resourceDef = this.resourceDefByType.get(type);

          if (!resourceDef) {
            console.error(`Tried to create resource with type: ${type} but it has not been registered.`);
            return -1;
          }

          const resourceConstructor = this.resourceConstructors.get(resourceDef) as
            | IRemoteResourceClass<ResourceDefinition>
            | undefined;

          if (!resourceConstructor) {
            throw console.error(`Resource "${resourceDef.name}" not registered with ScriptResourceManager.`);
            return -1;
          }

          const buffer = this.memory.buffer;
          const tripleBuffer = createTripleBuffer(this.ctx.gameToRenderTripleBufferFlags, resourceDef.byteLength);
          const resource = new resourceConstructor(this, buffer, ptr, tripleBuffer);
          const resourceId = createResource(this.ctx, Thread.Shared, resourceDef.name, tripleBuffer);
          resource.resourceId = resourceId;
          setRemoteResource(this.ctx, resourceId, resource);
          this.ptrToResourceId.set(ptr, resourceId);
          this.resources.push(resource as unknown as RemoteResource<ResourceDefinition>);
          this.resourceStorage.set(resourceId, {
            refView: new Uint32Array(buffer, ptr, resourceDef.byteLength),
            prevRefs: [],
          });
          return 0;
        },
        dispose_resource: (ptr: number) => {
          const resourceId = this.ptrToResourceId.get(ptr);

          if (!resourceId) {
            return 0;
          }

          if (disposeResource(this.ctx, resourceId)) {
            return 1;
          }

          return 0;
        },
      },
      wasi_snapshot_preview1: {
        environ_sizes_get: () => {
          return 0;
        },
        environ_get: () => {
          return 0;
        },
        clock_time_get: (a: number, b: number, ptime: number) => {
          const now = Date.now();
          // "now" is in ms, and wasi times are in ns.
          const nsec = Math.round(now * 1000 * 1000);
          this.U32Heap[ptime >> 2] = nsec >>> 0;
          this.U32Heap[(ptime + 4) >> 2] = (nsec / Math.pow(2, 32)) >>> 0;
          return 0;
        },
        fd_seek: () => {
          return 70;
        },
        fd_write: (fd: number, iov: number, iovcnt: number, pnum: number) => {
          const out: string[] = [];
          let num = 0;
          for (let i = 0; i < iovcnt; i++) {
            const iovPtr = iov + i * 8;
            const ptr = this.U32Heap[iovPtr >> 2];
            const len = this.U32Heap[(iovPtr + 4) >> 2];
            const str = this.textDecoder.decode(this.U8Heap.slice(ptr, ptr + len));
            out.push(str);

            num += len;
          }
          this.U32Heap[pnum >> 2] = num;

          if (fd === 1) {
            console.log(...out);
          } else {
            console.error(...out);
          }

          return 0;
        },
        fd_close: () => {
          return 0;
        },
        proc_exit: (code: number) => {
          throw new Error(`exit(${code})`);
        },
      },
    };
  }
}
