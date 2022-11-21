import { getReadBufferIndex, TripleBuffer } from "../allocator/TripleBuffer";
import { BaseThreadContext } from "../module/module.common";
import kebabToPascalCase from "../utils/kebabToPascalCase";
import { ILocalResourceManager, LocalResource, ResourceDefinition } from "./ResourceDefinition";

export interface ILocalResourceClass<
  Def extends ResourceDefinition,
  ThreadContext extends BaseThreadContext = BaseThreadContext
> {
  new (manager: ILocalResourceManager, resourceId: number, tripleBuffer: TripleBuffer): LocalResource<
    Def,
    ThreadContext
  >;
  resourceDef: Def;
}

export function defineLocalResourceClass<
  Def extends ResourceDefinition,
  ThreadContext extends BaseThreadContext = BaseThreadContext
>(resourceDef: Def): ILocalResourceClass<Def, ThreadContext> {
  const { name, schema } = resourceDef;

  function LocalResourceClass(
    this: LocalResource<Def>,
    manager: ILocalResourceManager,
    resourceId: number,
    tripleBuffer: TripleBuffer
  ) {
    this.resourceId = resourceId;
    this.tripleBuffer = tripleBuffer;
    this.manager = manager;
    this.__props = {};

    const buffers = this.tripleBuffer.buffers;
    const schema = (LocalResourceClass as unknown as ILocalResourceClass<Def>).resourceDef.schema;

    for (const propName in schema) {
      const prop = schema[propName];

      this.__props[propName] = [
        new prop.arrayType(buffers[0], prop.byteOffset, prop.size),
        new prop.arrayType(buffers[1], prop.byteOffset, prop.size),
        new prop.arrayType(buffers[2], prop.byteOffset, prop.size),
      ];
    }
  }

  Object.defineProperties(LocalResourceClass, {
    name: { value: kebabToPascalCase(name) },
    resourceDef: { value: resourceDef },
  });

  Object.defineProperties(LocalResourceClass.prototype, {
    load: {
      value() {
        return Promise.resolve();
      },
    },
    dispose: { value() {} },
  });

  for (const propName in schema) {
    const prop = schema[propName];

    if (prop.type === "string") {
      Object.defineProperty(LocalResourceClass.prototype, propName, {
        get(this: LocalResource<Def>) {
          const index = getReadBufferIndex(this.tripleBuffer);
          const resourceId = this.__props[propName][index][0];
          return this.manager.getString(resourceId);
        },
      });
    } else if (prop.type === "arrayBuffer") {
      Object.defineProperty(LocalResourceClass.prototype, propName, {
        get(this: LocalResource<Def>) {
          const index = getReadBufferIndex(this.tripleBuffer);
          const resourceId = this.__props[propName][index][1];
          return this.manager.getArrayBuffer(resourceId);
        },
      });
    } else if (prop.type === "ref") {
      Object.defineProperty(LocalResourceClass.prototype, propName, {
        get(this: LocalResource<Def>) {
          const index = getReadBufferIndex(this.tripleBuffer);
          const resourceId = this.__props[propName][index][0];
          return this.manager.getResource((this.constructor as any).resourceDef, resourceId);
        },
      });
    } else if (prop.type === "refArray" || prop.type === "refMap") {
      Object.defineProperty(LocalResourceClass.prototype, propName, {
        get(this: LocalResource<Def>) {
          const index = getReadBufferIndex(this.tripleBuffer);
          const arr = this.__props[propName][index];
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
      Object.defineProperty(LocalResourceClass.prototype, propName, {
        get(this: LocalResource<Def>) {
          const index = getReadBufferIndex(this.tripleBuffer);
          return this.__props[propName][index][0];
        },
      });
    } else {
      Object.defineProperty(LocalResourceClass.prototype, propName, {
        get(this: LocalResource<Def>) {
          const index = getReadBufferIndex(this.tripleBuffer);
          return this.__props[propName][index];
        },
      });
    }
  }

  return LocalResourceClass as unknown as ILocalResourceClass<Def, ThreadContext>;
}
