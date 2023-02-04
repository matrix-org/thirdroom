import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { copyToWriteBuffer, createTripleBuffer } from "../allocator/TripleBuffer";
import { AudioModule } from "../audio/audio.game";
import { GameState } from "../GameTypes";
import { GLTFResource } from "../gltf/gltf.game";
import { createMatrixWASMModule } from "../matrix/matrix.game";
import { getModule, Thread } from "../module/module.common";
import { EnableMatrixMaterialMessage, RendererMessageType } from "../renderer/renderer.common";
import { ScriptWebAssemblyInstance } from "../scripting/scripting.game";
import { RemoteScene } from "./RemoteResources";
import {
  addResourceRef,
  createArrayBufferResource,
  createRemoteResource,
  createStringResource,
  getRemoteResource,
  removeResourceRef,
  ResourceModule,
  ResourceTransformData,
} from "./resource.game";
import {
  IRemoteResourceClass,
  IRemoteResourceManager,
  RemoteResource,
  ResourceData,
  ResourceDefinition,
  ResourceManagerGLTFCacheEntry,
} from "./ResourceDefinition";
import { decodeString } from "./strings";

interface MutableArrayBuffer {
  resourceId: number;
  writeView: Uint8Array;
  readView: Uint8Array;
}

export class ScriptResourceManager implements IRemoteResourceManager<GameState> {
  public memory: WebAssembly.Memory;
  public buffer: ArrayBuffer | SharedArrayBuffer;
  public U8Heap: Uint8Array;
  public U32Heap: Uint32Array;
  private textDecoder = new TextDecoder();
  private textEncoder = new TextEncoder();
  private instance?: ScriptWebAssemblyInstance;
  private gltfCache: Map<string, ResourceManagerGLTFCacheEntry> = new Map();
  public activeScene?: RemoteScene;

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
  private ptrToResourceId: Map<number, number> = new Map();
  public resources: RemoteResource<GameState>[] = [];
  private mutableArrayBuffers: MutableArrayBuffer[] = [];

  constructor(ctx: GameState, allowedResources: ResourceDefinition[]) {
    this.ctx = ctx;
    this.memory = new WebAssembly.Memory({ initial: 1024, maximum: 1024 });
    this.buffer = this.memory.buffer;
    this.U8Heap = new Uint8Array(this.buffer);
    this.U32Heap = new Uint32Array(this.buffer);
  }

  setInstance(instance: ScriptWebAssemblyInstance): void {
    this.instance = instance;
  }

  getCachedGLTF(uri: string): Promise<GLTFResource> | undefined {
    const entry = this.gltfCache.get(uri);

    if (!entry) {
      return undefined;
    }

    entry.refCount++;

    return entry.promise;
  }

  cacheGLTF(uri: string, promise: Promise<GLTFResource>): void {
    this.gltfCache.set(uri, {
      promise,
      refCount: 1,
    });
  }

  removeGLTFRef(uri: string): boolean {
    const entry = this.gltfCache.get(uri);

    if (entry && --entry.refCount <= 0) {
      this.gltfCache.delete(uri);
      return true;
    }

    return false;
  }

  allocateResource(resourceDef: ResourceDefinition): ResourceData {
    const buffer = this.memory.buffer;
    const ptr = this.allocate(resourceDef.byteLength);
    const tripleBuffer = createTripleBuffer(this.ctx.gameToRenderTripleBufferFlags, resourceDef.byteLength);

    return {
      ptr,
      buffer,
      tripleBuffer,
    };
  }

  createResource(resource: RemoteResource<GameState>): number {
    const resourceId = createRemoteResource(this.ctx, resource);
    this.ptrToResourceId.set(resource.ptr, resourceId);
    this.resources.push(resource);
    return resourceId;
  }

  removeResourceRefs(resourceId: number): boolean {
    const index = this.resources.findIndex((resource) => resource.eid === resourceId);

    if (index === -1) {
      return false;
    }

    const resource = this.resources[index];

    const resourceModule = getModule(this.ctx, ResourceModule);

    const transform = resourceModule.resourceTransformData.get(resource.resourceType);

    if (!transform) {
      throw new Error(`Resource type "${resource.resourceType}" not registered.`);
    }

    for (let i = 0; i < transform.refOffsets.length; i++) {
      const refIsBackRef = transform.refIsBackRef[i];

      if (refIsBackRef) {
        continue;
      }

      const refOffset = transform.refOffsets[i] / Uint32Array.BYTES_PER_ELEMENT;
      const refPtr = resource.refView[refOffset];

      if (refPtr) {
        const resourceId = this.ptrToResourceId.get(refPtr);

        if (resourceId) {
          this.removeRef(resourceId);
        }
      }
    }

    this.deallocate(resource.ptr);

    this.ptrToResourceId.delete(resource.ptr);
    this.resources.splice(index, 1);

    return true;
  }

  getString(store: Uint32Array): string {
    const resourceId = this.ptrToResourceId.get(store[0]);
    return resourceId ? getRemoteResource<string>(this.ctx, resourceId) || "" : "";
  }

  setString(value: string, store: Uint32Array): void {
    const curResourceId = this.ptrToResourceId.get(store[0]);
    const curValue = curResourceId ? getRemoteResource<string>(this.ctx, curResourceId) || "" : "";

    if (curValue !== value) {
      if (store[0]) {
        this.removeRef(store[0]);
      }

      if (value) {
        const ptr = this.writeString(value);
        store[0] = ptr;
        const resourceId = createStringResource(this.ctx, value, () => {
          this.deallocate(ptr);
        });
        this.addRef(resourceId);
        this.ptrToResourceId.set(ptr, resourceId);
      }
    }
  }

  writeString(value: string): number {
    const arr = this.textEncoder.encode(value);
    const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
    nullTerminatedArr.set(arr);
    const ptr = this.allocate(nullTerminatedArr.byteLength);
    this.U8Heap.set(nullTerminatedArr, ptr);
    return ptr;
  }

  getArrayBuffer(store: Uint32Array): SharedArrayBuffer {
    if (!store[1]) {
      throw new Error("arrayBuffer field not initialized.");
    }

    const resourceId = this.ptrToResourceId.get(store[1]) as number;
    return getRemoteResource<SharedArrayBuffer>(this.ctx, resourceId) as SharedArrayBuffer;
  }

  setArrayBuffer(value: SharedArrayBuffer, store: Uint32Array): void {
    if (store[1]) {
      throw new Error("You cannot mutate an existing arrayBuffer field.");
    }

    // TODO: Add a function to actually get a range of buffer data in script context
    // We shouldn't allocate all the buffer data on the script heap because if you aren't using it,
    // it's a waste of memory.

    const dataPtr = this.allocate(value.byteLength);
    const bufView = new Uint8Array(value);
    this.U8Heap.set(bufView, dataPtr);

    const ptr = this.allocate(Uint32Array.BYTES_PER_ELEMENT * 3);

    this.U32Heap[ptr / Uint32Array.BYTES_PER_ELEMENT] = value.byteLength;
    this.U32Heap[ptr / Uint32Array.BYTES_PER_ELEMENT + 1] = 0; // Immutable
    this.U32Heap[ptr / Uint32Array.BYTES_PER_ELEMENT + 2] = dataPtr;

    store[0] = value.byteLength;
    store[1] = 0; // Immutable
    store[2] = ptr;

    const resourceId = createArrayBufferResource(this.ctx, value);
    this.addRef(resourceId);
    this.ptrToResourceId.set(ptr, resourceId);
  }

  initArrayBuffer(store: Uint32Array) {
    const size = store[0];
    const mutable = store[1];
    const dataPtr = store[2];
    const readView = new Uint8Array(this.buffer, dataPtr, size);
    const buffer = new SharedArrayBuffer(size);
    const writeView = new Uint8Array(buffer);
    writeView.set(readView);

    const resourceId = createArrayBufferResource(this.ctx, buffer);
    this.ptrToResourceId.set(dataPtr, resourceId);

    if (mutable) {
      this.mutableArrayBuffers.push({ resourceId, writeView, readView });
    }
  }

  getRef<T extends RemoteResource<GameState>>(store: Uint32Array): T | undefined {
    const resourceId = this.ptrToResourceId.get(store[0]);
    return resourceId ? getRemoteResource<T>(this.ctx, resourceId) : undefined;
  }

  setRef(value: RemoteResource<GameState> | undefined, store: Uint32Array, backRef: boolean): void {
    const curResourceId = this.ptrToResourceId.get(store[0]) || 0;
    const nextResourceId = value?.eid || 0;

    if (!backRef) {
      if (nextResourceId && nextResourceId !== curResourceId) {
        this.addRef(nextResourceId);
      }

      if (curResourceId && nextResourceId !== curResourceId) {
        this.removeRef(curResourceId);
      }
    }

    store[0] = value ? value.ptr : 0;
  }

  setRefArray(value: RemoteResource<GameState>[], store: Uint32Array): void {
    for (let i = 0; i < value.length; i++) {
      this.addRef(value[i].eid);
    }

    for (let i = 0; i < store.length; i++) {
      const resourceId = this.ptrToResourceId.get(store[i]);

      if (resourceId) {
        this.removeRef(resourceId);
      }

      store[i] = 0;
    }

    for (let i = 0; i < value.length; i++) {
      store[i] = value[i].ptr || 0;
    }
  }

  setRefMap(value: { [key: number]: RemoteResource<GameState> }, store: Uint32Array): void {
    for (const key in value) {
      this.addRef(value[key].eid);
    }

    for (let i = 0; i < store.length; i++) {
      const resourceId = this.ptrToResourceId.get(store[i]);

      if (resourceId) {
        this.removeRef(resourceId);
      }

      store[i] = 0;
    }

    for (const key in value) {
      store[key] = value[key].ptr || 0;
    }
  }

  getRefArrayItem<T extends RemoteResource<GameState>>(index: number, store: Uint32Array): T | undefined {
    const resourceId = this.ptrToResourceId.get(store[index]);
    return resourceId ? getRemoteResource<T>(this.ctx, resourceId) : undefined;
  }

  addRef(resourceId: number) {
    addResourceRef(this.ctx, resourceId);
  }

  removeRef(resourceId: number) {
    removeResourceRef(this.ctx, resourceId);
  }

  /**
   * After the script has finished running its update method we need to copy resource
   * data into the triple buffer to go to the other threads. However, the resources
   * store refs as pointers within the WASM heap. So we need to translate those to
   * resource ids. In addition we need strings and arraybuffers to exist on the other threads.
   */
  commitResources() {
    const resourceModule = getModule(this.ctx, ResourceModule);
    const resources = this.resources;

    for (let i = 0; i < this.mutableArrayBuffers.length; i++) {
      const { writeView, readView } = this.mutableArrayBuffers[i];
      writeView.set(readView);
    }

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const { writeView, refView, refOffsets, refIsString } = resourceModule.resourceTransformData.get(
        resource.resourceType
      ) as ResourceTransformData;
      writeView.set(resource.byteView);

      for (let j = 0; j < refOffsets.length; j++) {
        const refOffset = refOffsets[j] / Uint32Array.BYTES_PER_ELEMENT;
        const nextRefPtr = resource.refView[refOffset];
        const prevRefPtr = resource.prevRefs[j];
        let nextResourceId = this.ptrToResourceId.get(nextRefPtr);

        if (nextRefPtr !== prevRefPtr && refIsString[j]) {
          const prevResourceId = this.ptrToResourceId.get(prevRefPtr);

          if (prevResourceId) {
            // TODO: Dispose non-string resources automatically when they are no longer referenced?
            removeResourceRef(this.ctx, prevResourceId);
          }

          resource.prevRefs[j] = nextRefPtr;

          if (!nextResourceId) {
            nextResourceId = createStringResource(this.ctx, decodeString(nextRefPtr, this.U8Heap));
          }
        }

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
          this.ctx.sendMessage<EnableMatrixMaterialMessage>(Thread.Render, {
            type: RendererMessageType.EnableMatrixMaterial,
            enabled: !!enabled,
          });
        },
        get_audio_frequency_data: (audioDataPtr: number) => {
          const audio = getModule(this.ctx, AudioModule);
          const audioAnalyser = getReadObjectBufferView(audio.analyserTripleBuffer);
          this.U8Heap.set(audioAnalyser.frequencyData, audioDataPtr);
        },
        get_audio_time_data: (audioDataPtr: number) => {
          const audio = getModule(this.ctx, AudioModule);
          const audioAnalyser = getReadObjectBufferView(audio.analyserTripleBuffer);
          this.U8Heap.set(audioAnalyser.timeData, audioDataPtr);
        },
      },
      matrix: createMatrixWASMModule(this.ctx, this),
      websg: {
        get_active_scene: () => {
          return this.activeScene?.ptr || 0;
        },
        get_resource_by_name: (resourceType: number, namePtr: number) => {
          const resources = this.resources;
          const name = decodeString(namePtr, this.U8Heap);

          for (let i = 0; i < resources.length; i++) {
            const resource = resources[i];
            const def = resource.constructor.resourceDef;

            if (def.resourceType === resourceType && "name" in resource && resource.name === name) {
              return resource.ptr;
            }
          }

          return 0;
        },
        create_resource: (type: number, ptr: number) => {
          const resourceModule = getModule(this.ctx, ResourceModule);

          const resourceDef = resourceModule.resourceDefByType.get(type);

          if (!resourceDef) {
            console.error(`Tried to create resource with type: ${type} but it has not been registered.`);
            return -1;
          }

          const resourceConstructor = resourceModule.resourceConstructors.get(resourceDef) as
            | IRemoteResourceClass<ResourceDefinition>
            | undefined;

          if (!resourceConstructor) {
            return -1;
          }

          new resourceConstructor(this, {
            ptr,
            buffer: this.memory.buffer,
            tripleBuffer: createTripleBuffer(this.ctx.gameToRenderTripleBufferFlags, resourceDef.byteLength),
          });

          return 0;
        },
        dispose_resource: (ptr: number) => {
          const resourceId = this.ptrToResourceId.get(ptr);

          if (!resourceId) {
            return 0;
          }

          if (this.removeResourceRefs(resourceId)) {
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
