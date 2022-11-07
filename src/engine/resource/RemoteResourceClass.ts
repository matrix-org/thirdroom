import { TripleBuffer } from "../allocator/TripleBuffer";
import kebabToPascalCase from "../utils/kebabToPascalCase";
import { ResourceId } from "./resource.common";
import {
  InitialResourceProps,
  IRemoteResourceManager,
  RemoteResource,
  RemoteResourceStringStore,
  ResourceDefinition,
} from "./ResourceDefinition";

export interface IRemoteResourceClass<Def extends ResourceDefinition> {
  new (
    manager: IRemoteResourceManager,
    resourceId: ResourceId,
    buffer: ArrayBuffer,
    byteOffset: number,
    tripleBuffer: TripleBuffer,
    props: InitialResourceProps<Def>
  ): RemoteResource<Def>;
  resourceDef: Def;
}

export function defineRemoteResourceClass<Def extends ResourceDefinition>(resourceDef: Def): IRemoteResourceClass<Def> {
  const { name, schema } = resourceDef;

  function RemoteResourceClass(
    this: RemoteResource<Def>,
    manager: IRemoteResourceManager,
    resourceId: ResourceId,
    buffer: ArrayBuffer,
    byteOffset: number,
    tripleBuffer: TripleBuffer,
    props: InitialResourceProps<Def>
  ) {
    this.initialized = false;
    this.manager = manager;
    this.byteOffset = byteOffset;
    this.resourceId = resourceId;
    this.byteView = new Uint8Array(buffer, byteOffset, resourceDef.byteLength);
    this.tripleBuffer = tripleBuffer;
    this.__props = {};

    const schema = (RemoteResourceClass as unknown as IRemoteResourceClass<Def>).resourceDef.schema;

    for (const propName in schema) {
      const prop = schema[propName];
      const initialValue = props[propName] !== undefined ? props[propName] : prop.default;
      const view = new prop.arrayType(buffer, this.byteOffset + prop.byteOffset, prop.size);

      if (prop.type === "string") {
        const store: RemoteResourceStringStore = {
          prevPtr: 0,
          value: "",
          view: view as Uint32Array,
          resourceIdView: new Uint32Array([0]),
        };

        if (initialValue) {
          this.manager.setString(initialValue as string, store);
        }

        this.__props[propName] = store;
      } else {
        if (initialValue !== undefined) {
          if (prop.size === 1) {
            view[0] = initialValue as number;
          } else {
            view.set(initialValue as ArrayLike<number>);
          }
        }

        this.__props[propName] = view;
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
        for (const propName in schema) {
          const prop = schema[propName];

          if (prop.type === "ref" || prop.type === "string" || prop.type === "arraybuffer") {
            const resourceId = this.__props[propName].resourceIdView[0];

            if (resourceId) {
              this.manager.removeRef(resourceId);
            }
          } else if (prop.type === "refArray") {
            const resourceIds = this.__props[propName].resourceIdView;

            for (let i = 0; i < resourceIds.length; i++) {
              const resourceId = resourceIds[i];

              if (resourceId) {
                this.manager.removeRef(resourceId);
              }
            }
          }
        }
      },
    },
  });

  for (const propName in schema) {
    const prop = schema[propName];

    if (prop.type === "string") {
      const setter = prop.mutable
        ? {
            set(this: RemoteResource<Def>, value?: string) {
              this.manager.setString(value, this.__props[propName]);
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResource<Def>) {
          return this.manager.getString(this.__props[propName]);
        },
      });
    } else if (prop.type === "ref" || prop.type === "arraybuffer") {
      // TODO
      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        get(this: RemoteResource<Def>) {
          const resourceId = this.__props[propName][0];
          return this.manager.getResource((this.constructor as any).resourceDef, resourceId);
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
