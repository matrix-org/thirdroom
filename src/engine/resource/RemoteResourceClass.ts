import { GameState } from "../GameTypes";
import kebabToPascalCase from "../utils/kebabToPascalCase";
import {
  Schema,
  DefinedResource,
  InitialRemoteResourceProps,
  IRemoteResourceClass,
  IRemoteResourceManager,
  RemoteResource,
  ResourceData,
} from "./ResourceDefinition";

export function defineRemoteResourceClass<T extends number, S extends Schema, Def extends DefinedResource<T, S>>(
  resourceDef: Def
): IRemoteResourceClass<Def> {
  const { name, schema, resourceType } = resourceDef;

  function RemoteResourceClass(
    this: RemoteResource<GameState>,
    manager: IRemoteResourceManager<GameState>,
    propsOrResourceData?: ResourceData | InitialRemoteResourceProps<GameState, Def>
  ) {
    this.manager = manager;
    const isResourceData = propsOrResourceData && "ptr" in propsOrResourceData;
    const resourceData = isResourceData
      ? (propsOrResourceData as ResourceData)
      : this.manager.allocateResource(resourceDef);
    const initialProps = isResourceData
      ? undefined
      : (propsOrResourceData as InitialRemoteResourceProps<GameState, Def> | undefined);
    this.resourceType = resourceType;
    this.initialized = false;
    this.ptr = resourceData.ptr;
    this.byteView = new Uint8Array(resourceData.buffer, resourceData.ptr, resourceDef.byteLength);
    this.refView = new Uint32Array(
      resourceData.buffer,
      resourceData.ptr,
      resourceDef.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    this.prevRefs = [];
    this.tripleBuffer = resourceData.tripleBuffer;
    this.__props = {};

    const schema = (RemoteResourceClass as unknown as IRemoteResourceClass<Def>).resourceDef.schema;

    for (const propName in schema) {
      const prop = schema[propName];
      const store = new prop.arrayType(resourceData.buffer, this.ptr + prop.byteOffset, prop.size);

      // TODO handle setting defaults and prop validation when creating from ptr
      let initialValue: unknown;

      if (initialProps) {
        initialValue = initialProps[propName] !== undefined ? initialProps[propName] : prop.default;
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
          this.manager.setRef(initialValue as RemoteResource<GameState>, store as Uint32Array, prop.backRef);
        }

        this.__props[propName] = store;
      } else if (prop.type === "refArray") {
        if (initialValue !== undefined) {
          this.manager.setRefArray(initialValue as RemoteResource<GameState>[], store as Uint32Array);
        }

        this.__props[propName] = store;
      } else if (prop.type === "refMap") {
        if (initialValue !== undefined) {
          this.manager.setRefMap(initialValue as { [key: number]: RemoteResource<GameState> }, store as Uint32Array);
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

    this.eid = this.manager.createResource(this);
  }

  Object.defineProperties(RemoteResourceClass, {
    name: { value: kebabToPascalCase(name) },
    resourceDef: { value: resourceDef },
  });

  Object.defineProperties(RemoteResourceClass.prototype, {
    addRef: {
      value(this: RemoteResource<GameState>) {
        this.manager.addRef(this.eid);
      },
    },
    removeRef: {
      value(this: RemoteResource<GameState>) {
        this.manager.removeRef(this.eid);
      },
    },
    dispose: {
      value(this: RemoteResource<GameState>, ctx: GameState) {
        this.manager.disposeResource(this.eid);
      },
    },
  });

  for (const propName in schema) {
    const prop = schema[propName];

    if (prop.type === "string") {
      const setter = prop.mutable
        ? {
            set(this: RemoteResource<GameState>, value?: string) {
              this.manager.setString(value, this.__props[propName] as Uint32Array);
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResource<GameState>) {
          return this.manager.getString(this.__props[propName] as Uint32Array);
        },
      });
    } else if (prop.type === "arrayBuffer") {
      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        get(this: RemoteResource<GameState>) {
          return this.manager.getArrayBuffer(this.__props[propName] as Uint32Array);
        },
      });
    } else if (prop.type === "ref") {
      const setter = prop.mutable
        ? {
            set(this: RemoteResource<GameState>, value?: RemoteResource<GameState>) {
              this.manager.setRef(value, this.__props[propName] as Uint32Array, prop.backRef);
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResource<GameState>) {
          return this.manager.getRef(this.__props[propName] as Uint32Array);
        },
      });
    } else if (prop.type === "refArray") {
      const setter = prop.mutable
        ? {
            set(this: RemoteResource<GameState>, value: RemoteResource<GameState>[]) {
              this.manager.setRefArray(value, this.__props[propName] as Uint32Array);
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResource<GameState>) {
          const store = this.__props[propName] as Uint32Array;
          const resources = [];

          for (let i = 0; i < store.length; i++) {
            if (store[i] === 0) {
              break;
            }

            const resource = this.manager.getRefArrayItem(i, store);

            if (resource) {
              resources.push(resource);
            }
          }

          return resources;
        },
      });
    } else if (prop.type === "refMap") {
      const setter = prop.mutable
        ? {
            set(this: RemoteResource<GameState>, value: { [key: number]: RemoteResource<GameState> }) {
              this.manager.setRefMap(value, this.__props[propName] as Uint32Array);
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResource<GameState>) {
          const store = this.__props[propName] as Uint32Array;
          const resources = [];

          for (let i = 0; i < store.length; i++) {
            if (store[i]) {
              resources.push(this.manager.getRefArrayItem(i, store));
            } else {
              resources.push(undefined);
            }
          }

          return resources;
        },
      });
    } else if (prop.type === "bool") {
      const setter = prop.mutable
        ? {
            set(this: RemoteResource<GameState>, value: boolean) {
              this.__props[propName][0] = value ? 1 : 0;
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResource<GameState>) {
          return !!this.__props[propName][0];
        },
      });
    } else if (prop.size === 1) {
      const setter = prop.mutable
        ? {
            set(this: RemoteResource<GameState>, value: number) {
              this.__props[propName][0] = value;
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResource<GameState>) {
          return this.__props[propName][0];
        },
      });
    } else {
      const setter = prop.mutable
        ? {
            set(this: RemoteResource<GameState>, value: ArrayLike<number>) {
              this.__props[propName].set(value);
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResource<GameState>) {
          return this.__props[propName];
        },
      });
    }
  }

  return RemoteResourceClass as unknown as IRemoteResourceClass<Def>;
}
