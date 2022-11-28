import { TripleBuffer } from "../allocator/TripleBuffer";
import kebabToPascalCase from "../utils/kebabToPascalCase";
import { InitialResourceProps, IRemoteResourceManager, RemoteResource, ResourceDefinition } from "./ResourceDefinition";

export interface IRemoteResourceClass<Def extends ResourceDefinition> {
  new (
    manager: IRemoteResourceManager,
    buffer: ArrayBuffer,
    ptr: number,
    tripleBuffer: TripleBuffer,
    props?: InitialResourceProps<Def>
  ): RemoteResource<Def>;
  resourceDef: Def;
}

export function defineRemoteResourceClass<Def extends ResourceDefinition>(resourceDef: Def): IRemoteResourceClass<Def> {
  const { name, schema, resourceType } = resourceDef;

  function RemoteResourceClass(
    this: RemoteResource<Def>,
    manager: IRemoteResourceManager,
    buffer: ArrayBuffer,
    ptr: number,
    tripleBuffer: TripleBuffer,
    props?: InitialResourceProps<Def>
  ) {
    this.resourceId = 0;
    this.resourceType = resourceType;
    this.initialized = false;
    this.manager = manager;
    this.ptr = ptr;
    this.byteView = new Uint8Array(buffer, ptr, resourceDef.byteLength);
    this.tripleBuffer = tripleBuffer;
    this.__props = {};

    const schema = (RemoteResourceClass as unknown as IRemoteResourceClass<Def>).resourceDef.schema;

    for (const propName in schema) {
      const prop = schema[propName];
      const store = new prop.arrayType(buffer, this.ptr + prop.byteOffset, prop.size);

      // TODO handle setting defaults and prop validation when creating from ptr
      let initialValue: any;

      if (props) {
        initialValue = props[propName] !== undefined ? props[propName] : prop.default;
      } else {
        if (
          prop.default !== undefined &&
          prop.type !== "string" &&
          prop.type !== "arrayBuffer" &&
          prop.type !== "ref" &&
          prop.type !== "refArray" &&
          prop.type !== "refMap" &&
          !store[0]
        ) {
          if (prop.size === 1) {
            store[0] = prop.default as number;
          } else {
            store.set(prop.default as ArrayLike<number>);
          }
        }
      }

      if (prop.type === "string") {
        if (initialValue) {
          this.manager.setString(initialValue as string, store as Uint32Array);
        }

        this.__props[propName] = store;
      } else if (prop.type === "arrayBuffer") {
        if (initialValue) {
          this.manager.setArrayBuffer(initialValue as SharedArrayBuffer, store as Uint32Array);
        }

        this.__props[propName] = store;
      } else if (prop.type === "ref") {
        if (initialValue) {
          this.manager.setRef(initialValue, store as Uint32Array);
        }

        this.__props[propName] = store;
      } else if (prop.type === "refArray") {
        if (initialValue !== undefined) {
          const refs = initialValue as RemoteResource<ResourceDefinition>[];

          for (let i = 0; i < refs.length; i++) {
            const ref = refs[i];
            store[i] = ref.ptr || ref.resourceId;
          }
        }

        this.__props[propName] = store;
      } else {
        if (initialValue !== undefined) {
          if (prop.size === 1) {
            store[0] = initialValue as number;
          } else {
            store.set(initialValue as ArrayLike<number>);
          }
        }

        this.__props[propName] = store;
      }
    }
  }

  Object.defineProperties(RemoteResourceClass, {
    name: { value: kebabToPascalCase(name) },
    resourceDef: { value: resourceDef },
  });

  Object.defineProperties(RemoteResourceClass.prototype, {
    addRef: {
      value(this: RemoteResource<Def>) {
        this.manager.addRef(this.resourceId);
      },
    },
    removeRef: {
      value(this: RemoteResource<Def>) {
        this.manager.removeRef(this.resourceId);
      },
    },
    dispose: {
      value(this: RemoteResource<Def>) {
        this.manager.disposeResource(this.resourceId);
      },
    },
  });

  for (const propName in schema) {
    const prop = schema[propName];

    if (prop.type === "string") {
      const setter = prop.mutable
        ? {
            set(this: RemoteResource<Def>, value?: string) {
              this.manager.setString(value, this.__props[propName] as Uint32Array);
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResource<Def>) {
          return this.manager.getString(this.__props[propName] as Uint32Array);
        },
      });
    } else if (prop.type === "arrayBuffer") {
      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        get(this: RemoteResource<Def>) {
          return this.manager.getArrayBuffer(this.__props[propName] as Uint32Array);
        },
      });
    } else if (prop.type === "ref") {
      const setter = prop.mutable
        ? {
            set(this: RemoteResource<Def>, value?: any) {
              this.manager.setRef(value, this.__props[propName] as Uint32Array);
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResource<Def>) {
          return this.manager.getRef((this.constructor as any).resourceDef, this.__props[propName] as Uint32Array);
        },
      });
    } else if (prop.type === "refArray") {
      // TODO
      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        get(this: RemoteResource<Def>) {
          const arr = this.__props[propName];
          const resources = [];

          for (let i = 0; i < arr.length; i++) {
            if (arr[i] === 0) {
              break;
            }

            resources.push(this.manager.getResource((this.constructor as any).resourceDef, arr[i]));
          }

          return resources;
        },
      });
    } else if (prop.type === "refMap") {
      // TODO
      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        get(this: RemoteResource<Def>) {
          const arr = this.__props[propName];
          const resources = [];

          for (let i = 0; i < arr.length; i++) {
            if (arr[i]) {
              resources.push(this.manager.getResource((this.constructor as any).resourceDef, arr[i]));
            } else {
              resources.push(undefined);
            }
          }

          return resources;
        },
      });
    } else if (prop.size === 1) {
      const setter = prop.mutable
        ? {
            set(this: RemoteResource<Def>, value: number) {
              this.__props[propName][0] = value;
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResource<Def>) {
          return this.__props[propName][0];
        },
      });
    } else {
      const setter = prop.mutable
        ? {
            set(this: RemoteResource<Def>, value: ArrayLike<number>) {
              this.__props[propName].set(value);
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResource<Def>) {
          return this.__props[propName];
        },
      });
    }
  }

  return RemoteResourceClass as unknown as IRemoteResourceClass<Def>;
}
