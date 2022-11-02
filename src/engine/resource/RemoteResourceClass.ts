import { TripleBuffer } from "../allocator/TripleBuffer";
import kebabToPascalCase from "../utils/kebabToPascalCase";
import { ResourceId } from "./resource.common";
import { InitialResourceProps, IRemoteResourceManager, RemoteResource, ResourceDefinition } from "./ResourceDefinition";

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

type PrivateRemoteResource<Def extends ResourceDefinition> = RemoteResource<Def> & {
  manager: IRemoteResourceManager;
  __props: { [key: string]: any };
};

export function defineRemoteResourceClass<Def extends ResourceDefinition>(resourceDef: Def): IRemoteResourceClass<Def> {
  const { name, schema } = resourceDef;

  function RemoteResourceClass(
    this: PrivateRemoteResource<Def>,
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
      const arr = new prop.arrayType(buffer, this.byteOffset + prop.byteOffset, prop.size);

      if (props[propName] !== undefined) {
        if (prop.type === "string") {
          this.manager.setString(arr.byteOffset, props[propName] as string);
        } else if (prop.size === 1) {
          arr[0] = props[propName] as number;
        } else {
          arr.set(props[propName] as ArrayLike<number>);
        }
      } else if (prop.default !== undefined) {
        if (prop.size === 1) {
          arr[0] = prop.default as number;
        } else {
          arr.set(prop.default as ArrayLike<number>);
        }
      }

      this.__props[propName] = arr;
    }
  }

  Object.defineProperties(RemoteResourceClass, {
    name: { value: kebabToPascalCase(name) },
    resourceDef: { value: resourceDef },
  });

  for (const propName in schema) {
    const prop = schema[propName];

    if (prop.type === "string") {
      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        get(this: PrivateRemoteResource<Def>) {
          const byteOffset = this.__props[propName][0];
          return this.manager.getString(byteOffset);
        },
      });
    } else if (prop.type === "ref" || prop.type === "arraybuffer") {
      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        get(this: PrivateRemoteResource<Def>) {
          const resourceId = this.__props[propName][0];
          return this.manager.getResource((this.constructor as any).resourceDef, resourceId);
        },
      });
    } else if (prop.type === "refArray") {
      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        get(this: PrivateRemoteResource<Def>) {
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
      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        get(this: PrivateRemoteResource<Def>) {
          return this.__props[propName][0];
        },
      });
    } else {
      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        get(this: PrivateRemoteResource<Def>) {
          return this.__props[propName];
        },
      });
    }
  }

  return RemoteResourceClass as unknown as IRemoteResourceClass<Def>;
}
