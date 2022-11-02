import { createTripleBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { defineRemoteResourceClass, IRemoteResourceClass } from "./RemoteResourceClass";
import { ResourceId } from "./resource.common";
import { createResource, getRemoteResource, setRemoteResource } from "./resource.game";
import {
  InitialResourceProps,
  IRemoteResourceManager,
  MAX_C_STRING_BYTE_LENGTH,
  RemoteResource,
  ResourceDefinition,
} from "./ResourceDefinition";
import { LightResource } from "./schema";

export class ScriptResourceManager implements IRemoteResourceManager {
  public memory: WebAssembly.Memory;
  public buffer: ArrayBuffer | SharedArrayBuffer;
  public U8Heap: Uint8Array;
  public U32Heap: Uint32Array;
  public textDecoder: TextDecoder;
  public textEncoder: TextEncoder;

  private instance?: WebAssembly.Instance;

  // When allocating resource, allocate space in WASM memory and a triplebuffer
  // At end of frame copy each resource to triple buffer using ptr and byteLength
  // Replace ptrs with resource ids
  // Other threads use resource ids to look up associated resources

  // For the global resource manager, we always use resource ids
  // This means the the ScriptResourceManager is only different on the Game Thread

  // Strings are allocated on a single shared buffer. They are assumed to be immutable.
  // In the same way we check to see if the string ptr has changed before we decode it
  // we should
  private ptrToResourceId: Map<number, number> = new Map();
  private ctx: GameState;
  private resourceConstructors: Map<ResourceDefinition, IRemoteResourceClass<ResourceDefinition>> = new Map();
  public resources: RemoteResource<ResourceDefinition>[] = [];

  constructor(ctx: GameState) {
    this.ctx = ctx;
    this.memory = new WebAssembly.Memory({ initial: 256, maximum: 256 });
    this.buffer = this.memory.buffer;
    this.U8Heap = new Uint8Array(this.buffer);
    this.U32Heap = new Uint32Array(this.buffer);
    this.textDecoder = new TextDecoder();
    this.textEncoder = new TextEncoder();
  }

  setInstance(instance: WebAssembly.Instance): void {
    this.instance = instance;
  }

  createResource<Def extends ResourceDefinition>(
    resourceDef: Def,
    props: InitialResourceProps<Def>
  ): RemoteResource<Def> {
    let resourceConstructor = this.resourceConstructors.get(resourceDef) as IRemoteResourceClass<Def> | undefined;

    if (!resourceConstructor) {
      resourceConstructor = defineRemoteResourceClass<Def>(resourceDef);
      this.resourceConstructors.set(
        resourceDef,
        resourceConstructor as unknown as IRemoteResourceClass<ResourceDefinition>
      );
    }

    const buffer = this.memory.buffer;
    const ptr = this.allocate(resourceDef.byteLength);
    const tripleBuffer = createTripleBuffer(this.ctx.gameToRenderTripleBufferFlags, resourceDef.byteLength);
    const resourceId = createResource(this.ctx, Thread.Shared, resourceDef.name, tripleBuffer);
    const resource = new resourceConstructor(this, resourceId, buffer, ptr, tripleBuffer, props);
    tripleBuffer.byteViews[0].set(resource.byteView);
    tripleBuffer.byteViews[1].set(resource.byteView);
    tripleBuffer.byteViews[2].set(resource.byteView);
    setRemoteResource(this.ctx, resourceId, resource);
    this.ptrToResourceId.set(ptr, resourceId);
    this.resources.push(resource as unknown as RemoteResource<ResourceDefinition>);
    return resource;
  }

  getResource<Def extends ResourceDefinition>(
    resourceDef: Def,
    resourceId: ResourceId
  ): RemoteResource<Def> | undefined {
    return getRemoteResource<RemoteResource<Def>>(this.ctx, resourceId);
  }

  getString(ptr: number): string {
    if (!ptr) {
      return "";
    }

    const maxPtr = ptr + MAX_C_STRING_BYTE_LENGTH;
    let end = ptr;

    // Find the end of the null-terminated C string on the heap
    while (!(end >= maxPtr) && this.U8Heap[end]) {
      ++end;
    }

    // create a new subarray to store the string so that this always works with SharedArrayBuffer
    return this.textDecoder.decode(this.U8Heap.subarray(ptr, end));
  }

  setString(ptr: number, value: string): void {
    if (!ptr || !value) {
      return;
    }

    const arr = this.textEncoder.encode(value);
    const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
    nullTerminatedArr.set(arr);
    const strPtr = this.allocate(nullTerminatedArr.byteLength);
    this.U8Heap.set(nullTerminatedArr, strPtr);
    this.U32Heap[ptr / Uint32Array.BYTES_PER_ELEMENT] = strPtr;
  }

  allocate(byteLength: number): number {
    return (this.instance!.exports.allocate as Function)(byteLength);
  }

  deallocate(ptr: number): void {
    (this.instance!.exports.deallocate as Function)(ptr);
  }

  createImports(): WebAssembly.Imports {
    const printCharBuffers: (number[] | null)[] = [null, [], []];

    const printChar = (stream: number, curr: number) => {
      const buffer = printCharBuffers[stream];

      if (!buffer) {
        throw new Error("buffer doesn't exist");
      }

      if (curr === 0 || curr === 10) {
        if (stream === 1) {
          console.log(this.textDecoder.decode(new Uint8Array(buffer)));
        } else {
          console.error(this.textDecoder.decode(new Uint8Array(buffer)));
        }
        buffer.length = 0;
      } else {
        buffer.push(curr);
      }
    };

    return {
      env: {
        memory: this.memory,
      },
      wasgi: {
        get_light_by_name: (namePtr: number) => {
          const resources = this.resources;
          const name = this.getString(namePtr);

          for (let i = 0; i < resources.length; i++) {
            const resource = resources[i];
            const def = resource.constructor.resourceDef;

            if (def === LightResource && resource.name === name) {
              return resource.byteOffset;
            }
          }

          return 0;
        },
        create_light: () => {
          const resource = this.createResource(LightResource, {});
          return resource.byteOffset;
        },
        dispose_light: (ptr: number) => {},
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
          // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
          let num = 0;
          for (let i = 0; i < iovcnt; i++) {
            const ptr = this.U32Heap[iov >> 2];
            const len = this.U32Heap[(iov + 4) >> 2];
            iov += 8;
            for (let j = 0; j < len; j++) {
              printChar(fd, this.U8Heap[ptr + j]);
            }
            num += len;
          }
          this.U32Heap[pnum >> 2] = num;
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
