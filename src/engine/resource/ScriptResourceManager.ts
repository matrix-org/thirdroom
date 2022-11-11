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
import {
  InitialResourceProps,
  IRemoteResourceManager,
  RemoteResource,
  RemoteResourceArrayBufferStore,
  RemoteResourceRefStore,
  RemoteResourceStringStore,
  ResourceDefinition,
} from "./ResourceDefinition";
import {
  BufferViewResource,
  ImageResource,
  LightResource,
  LightType,
  MaterialResource,
  MaterialType,
  RemoteSampler,
  SamplerResource,
  TextureResource,
} from "./schema";
import { decodeString } from "./strings";

type ResourceTransformFunction = (resource: RemoteResource<ResourceDefinition>) => Uint8Array;

function defineResourceIdTransform<Def extends ResourceDefinition>(resourceDef: Def): ResourceTransformFunction {
  const buffer = new ArrayBuffer(resourceDef.byteLength);
  const byteView = new Uint8Array(buffer);

  const resourceIdViews: { propName: string; view: Uint32Array }[] = [];

  const schema = resourceDef.schema;

  for (const propName in schema) {
    const prop = schema[propName];

    if (prop.type === "ref" || prop.type === "refArray" || prop.type === "string" || prop.type === "arrayBuffer") {
      resourceIdViews.push({ propName, view: new Uint32Array(buffer, prop.byteOffset, prop.size) });
    }
  }

  return (resource: RemoteResource<ResourceDefinition>): Uint8Array => {
    byteView.set(resource.byteView);

    for (let i = 0; i < resourceIdViews.length; i++) {
      const resourceIdView = resourceIdViews[i];
      resourceIdView.view.set(resource.__props[resourceIdView.propName].resourceIdView);
    }

    return byteView;
  };
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
  private ptrToResourceId: Map<number, number> = new Map();
  private ctx: GameState;
  private resourceConstructors: Map<ResourceDefinition, IRemoteResourceClass<ResourceDefinition>> = new Map();
  private resourceIdTransforms: Map<ResourceDefinition, ResourceTransformFunction> = new Map();
  public resources: RemoteResource<ResourceDefinition>[] = [];

  constructor(ctx: GameState) {
    this.ctx = ctx;
    this.memory = new WebAssembly.Memory({ initial: 256, maximum: 256 });
    this.buffer = this.memory.buffer;
    this.U8Heap = new Uint8Array(this.buffer);
    this.U32Heap = new Uint32Array(this.buffer);
  }

  setInstance(instance: ScriptWebAssemblyInstance): void {
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
      this.resourceIdTransforms.set(resourceDef, defineResourceIdTransform(resourceDef));
    }

    const buffer = this.memory.buffer;
    const ptr = this.allocate(resourceDef.byteLength);
    const tripleBuffer = createTripleBuffer(this.ctx.gameToRenderTripleBufferFlags, resourceDef.byteLength);
    const resourceId = createResource(this.ctx, Thread.Shared, resourceDef.name, tripleBuffer, {
      dispose: () => {
        const index = this.resources.findIndex((resource) => resource.resourceId === resourceId);

        if (index !== -1) {
          this.resources.splice(index, 1);
        }

        this.ptrToResourceId.delete(ptr);
      },
    });
    const resource = new resourceConstructor(this, resourceId, buffer, ptr, tripleBuffer, props);
    setRemoteResource(this.ctx, resourceId, resource);
    console.log("alloc", ptr, resourceId);
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

  getString(store: RemoteResourceStringStore): string {
    const ptr = store.view[0];

    if (store.prevPtr !== store.view[0]) {
      store.value = decodeString(ptr, this.U8Heap);
      store.prevPtr = ptr;
    }

    return store.value;
  }

  setString(value: string, store: RemoteResourceStringStore): void {
    if (store.prevPtr) {
      this.deallocate(store.prevPtr);
    }

    const arr = this.textEncoder.encode(value);
    const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
    nullTerminatedArr.set(arr);

    const scriptStrPtr = this.allocate(nullTerminatedArr.byteLength);
    this.U8Heap.set(nullTerminatedArr, scriptStrPtr);

    store.value = value;
    store.prevPtr = scriptStrPtr;
    store.view[0] = scriptStrPtr;

    if (store.resourceIdView[0]) {
      disposeResource(this.ctx, store.resourceIdView[0]);
    }

    const resourceId = createStringResource(this.ctx, value);
    store.resourceIdView[0] = resourceId;
    addResourceRef(this.ctx, resourceId);
  }

  getArrayBuffer(store: RemoteResourceArrayBufferStore): SharedArrayBuffer {
    if (!store.value) {
      throw new Error("arrayBuffer field not initialized.");
    }

    return store.value;
  }

  setArrayBuffer(value: SharedArrayBuffer, store: RemoteResourceArrayBufferStore): void {
    if (store.value) {
      throw new Error("You cannot mutate an existing arrayBuffer field.");
    }

    // TODO: Add a function to actually get a range of buffer data in script context
    // We shouldn't allocate all the buffer data on the script heap because if you aren't using it,
    // it's a waste of memory.
    store.view[0] = 0;
    store.value = value;
    const resourceId = createArrayBufferResource(this.ctx, value);
    store.resourceIdView[0] = resourceId;
    addResourceRef(this.ctx, resourceId);
  }

  getRef<Def extends ResourceDefinition>(
    resourceDef: Def,
    store: RemoteResourceRefStore
  ): RemoteResource<Def> | undefined {
    return getRemoteResource<RemoteResource<Def>>(this.ctx, store.resourceIdView[0]);
  }

  setRef(value: RemoteResource<ResourceDefinition>, store: RemoteResourceRefStore): void {
    store.value = value;
    store.resourceIdView[0] = value.resourceId;
    store.view[0] = value.ptr;
  }

  addRef(resourceId: number) {
    addResourceRef(this.ctx, resourceId);
  }

  removeRef(resourceId: number) {
    disposeResource(this.ctx, resourceId);
  }

  commitResources() {
    const resources = this.resources;

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const transform = this.resourceIdTransforms.get(resource.constructor.resourceDef);

      if (transform) {
        const byteView = transform(resource);

        if (resource.initialized) {
          copyToWriteBuffer(resource.tripleBuffer, byteView);
        } else {
          const tripleBufferByteViews = resource.tripleBuffer.byteViews;
          tripleBufferByteViews[0].set(byteView);
          tripleBufferByteViews[1].set(byteView);
          tripleBufferByteViews[2].set(byteView);
          resource.initialized = true;
        }
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

    const getResourceByName = (resourceType: ResourceDefinition) => (namePtr: number) => {
      const resources = this.resources;
      const name = decodeString(namePtr, this.U8Heap);

      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        const def = resource.constructor.resourceDef;

        if (def === resourceType && resource.name === name) {
          return resource.ptr;
        }
      }

      return 0;
    };

    const stringSetter =
      (resourceType: ResourceDefinition, propName: string) => (resourcePtr: number, strPtr: number) => {
        const resourceId = this.ptrToResourceId.get(resourcePtr);

        if (!resourceId) {
          return 0;
        }

        const resource = this.getResource(resourceType, resourceId);

        if (!resource) {
          return 0;
        }

        const value = decodeString(strPtr, this.U8Heap);
        const store = resource.__props[propName] as RemoteResourceStringStore;
        store.value = value;
        store.prevPtr = strPtr;
        store.view[0] = strPtr;

        if (store.resourceIdView[0]) {
          disposeResource(this.ctx, store.resourceIdView[0]);
        }

        store.resourceIdView[0] = createStringResource(this.ctx, value);

        return 1;
      };

    const refSetter =
      (resourceType: ResourceDefinition, refType: ResourceDefinition, propName: string) =>
      (resourcePtr: number, refPtr: number): number => {
        const resourceId = this.ptrToResourceId.get(resourcePtr);

        if (!resourceId) {
          return 0;
        }

        const resource = this.getResource(resourceType, resourceId);

        if (!resource) {
          return 0;
        }

        const refResourceId = this.ptrToResourceId.get(refPtr) || 0;
        const refResource = this.getResource(refType, refResourceId);
        const store = resource.__props[propName] as RemoteResourceRefStore;
        console.log(propName, resourcePtr, refPtr, resourceId, refResourceId, refResource);
        store.value = refResource;
        store.view[0] = refPtr;

        if (store.resourceIdView[0]) {
          disposeResource(this.ctx, store.resourceIdView[0]);
        }

        store.resourceIdView[0] = refResourceId;

        return 1;
      };

    const resourceDisposer = (resourcePtr: number) => {
      const resourceId = this.ptrToResourceId.get(resourcePtr);

      if (!resourceId) {
        return 0;
      }

      if (disposeResource(this.ctx, resourceId)) {
        return 1;
      }

      return 0;
    };

    return {
      env: {
        memory: this.memory,
      },
      websg: {
        get_light_by_name: getResourceByName(LightResource),
        create_light: (type: LightType) => {
          const resource = this.createResource(LightResource, {
            type,
          });
          return resource.ptr;
        },
        set_light_name: stringSetter(LightResource, "name"),
        dispose_light: resourceDisposer,
        get_image_by_name: getResourceByName(ImageResource),
        create_image_from_uri: (uriPtr: number, flipY: number) => {
          const uri = decodeString(uriPtr, this.U8Heap);
          const resource = this.createResource(ImageResource, {
            uri,
            flipY: !!flipY,
          });
          return resource.ptr;
        },
        create_image_from_buffer_view: (bufferViewPtr: number, mimeTypePtr: number, flipY: number) => {
          const bufferViewResourceId = this.ptrToResourceId.get(bufferViewPtr);

          if (!bufferViewResourceId) {
            return 0;
          }

          const bufferViewResource = this.getResource(BufferViewResource, bufferViewResourceId);

          if (!bufferViewResource) {
            return 0;
          }

          const mimeType = decodeString(mimeTypePtr, this.U8Heap);
          const resource = this.createResource(ImageResource, {
            mimeType,
            bufferView: bufferViewResource,
          });

          return resource.ptr;
        },
        set_image_name: stringSetter(ImageResource, "name"),
        dispose_image: resourceDisposer,
        get_texture_by_name: getResourceByName(TextureResource),
        create_texture: (sourcePtr: number, samplerPtr: number, encoding: number) => {
          const sourceResourceId = this.ptrToResourceId.get(sourcePtr);

          if (!sourceResourceId) {
            return 0;
          }

          const sourceResource = this.getResource(ImageResource, sourceResourceId);

          if (!sourceResource) {
            return 0;
          }

          let samplerResource: RemoteSampler | undefined = undefined;
          const samplerResourceId = this.ptrToResourceId.get(samplerPtr);

          if (samplerResourceId) {
            samplerResource = this.getResource(SamplerResource, samplerResourceId);
          }

          const resource = this.createResource(TextureResource, {
            source: sourceResource,
            sampler: samplerResource,
            encoding: encoding || undefined,
          });

          return resource.ptr;
        },
        set_texture_name: stringSetter(TextureResource, "name"),
        dispose_texture: resourceDisposer,
        get_material_by_name: getResourceByName(MaterialResource),
        create_material: (type: MaterialType) => {
          const resource = this.createResource(MaterialResource, {
            type,
          });
          return resource.ptr;
        },
        set_material_name: stringSetter(MaterialResource, "name"),
        set_material_base_color_texture: refSetter(MaterialResource, TextureResource, "baseColorTexture"),
        set_material_metallic_roughness_texture: refSetter(
          MaterialResource,
          TextureResource,
          "metallicRoughnessTexture"
        ),
        set_material_normal_texture: refSetter(MaterialResource, TextureResource, "normalTexture"),
        set_material_occlusion_texture: refSetter(MaterialResource, TextureResource, "occlusionTexture"),
        set_material_emissive_texture: refSetter(MaterialResource, TextureResource, "emissiveTexture"),
        set_material_thickness_texture: refSetter(MaterialResource, TextureResource, "thicknessTexture"),
        set_material_transmission_texture: refSetter(MaterialResource, TextureResource, "transmissionTexture"),
        dispose_material: resourceDisposer,
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
