import { TripleBuffer } from "../allocator/TripleBuffer";
import { BaseThreadContext } from "../module/module.common";
import kebabToPascalCase from "../utils/kebabToPascalCase";
import {
  DefinedResource,
  ILocalResourceClass,
  ILocalResourceManager,
  LocalResource,
  ProcessedSchema,
  Schema,
} from "./ResourceDefinition";

function defineProp<S extends Schema>(
  LocalResourceClass: Function,
  prop: ProcessedSchema<S>[Extract<keyof S, string>],
  propName: string,
  vecPropIndex: number
) {
  const offset = prop.byteOffset / 4;
  const size = prop.size;

  if (prop.type === "string") {
    Object.defineProperty(LocalResourceClass.prototype, propName, {
      get(this: LocalResource) {
        const index = this.manager.readBufferIndex;
        const resourceId = this.u32Views[index][offset];
        return this.manager.resources.get(resourceId);
      },
    });
  } else if (prop.type === "arrayBuffer") {
    Object.defineProperty(LocalResourceClass.prototype, propName, {
      get(this: LocalResource) {
        const index = this.manager.readBufferIndex;
        const resourceId = this.u32Views[index][offset + 2];
        return this.manager.resources.get(resourceId);
      },
    });
  } else if (prop.type === "ref") {
    Object.defineProperty(LocalResourceClass.prototype, propName, {
      get(this: LocalResource) {
        const index = this.manager.readBufferIndex;
        const resourceId = this.u32Views[index][offset];
        return this.manager.resources.get(resourceId);
      },
    });
  } else if (prop.type === "refArray") {
    Object.defineProperty(LocalResourceClass.prototype, propName, {
      get(this: LocalResource) {
        const index = this.manager.readBufferIndex;
        const arr = this.u32Views[index];
        const resources = [];

        for (let i = offset; i < offset + size; i++) {
          if (arr[i] === 0) {
            break;
          }

          const resource = this.manager.resources.get(arr[i]);

          if (resource) {
            resources.push(resource);
          }
        }

        return resources;
      },
    });
  } else if (prop.type === "refMap") {
    Object.defineProperty(LocalResourceClass.prototype, propName, {
      get(this: LocalResource) {
        const index = this.manager.readBufferIndex;
        const arr = this.u32Views[index];
        const resources = [];

        for (let i = offset; i < offset + size; i++) {
          if (arr[i]) {
            resources.push(this.manager.resources.get(arr[i]));
          } else {
            resources.push(undefined);
          }
        }

        return resources;
      },
    });
  } else if (prop.type === "bool") {
    Object.defineProperty(LocalResourceClass.prototype, propName, {
      get(this: LocalResource) {
        const index = this.manager.readBufferIndex;
        return !!this.u32Views[index][offset];
      },
    });
  } else if (prop.size === 1) {
    if (prop.type === "f32") {
      Object.defineProperty(LocalResourceClass.prototype, propName, {
        get(this: LocalResource) {
          const index = this.manager.readBufferIndex;
          return this.f32Views[index][offset];
        },
      });
    } else {
      Object.defineProperty(LocalResourceClass.prototype, propName, {
        get(this: LocalResource) {
          const index = this.manager.readBufferIndex;
          return this.u32Views[index][offset];
        },
      });
    }
  } else {
    Object.defineProperty(LocalResourceClass.prototype, propName, {
      get(this: LocalResource) {
        const index = this.manager.readBufferIndex;
        return this.vecViews[vecPropIndex][index];
      },
    });
  }
}

export function defineLocalResourceClass<
  T extends number,
  S extends Schema,
  Def extends DefinedResource<T, S>,
  ThreadContext extends BaseThreadContext = BaseThreadContext
>(resourceDef: Def): ILocalResourceClass<Def, ThreadContext> {
  const { name, schema, resourceType } = resourceDef;

  function LocalResourceClass(
    this: LocalResource,
    manager: ILocalResourceManager,
    resourceId: number,
    tripleBuffer: TripleBuffer
  ) {
    this.eid = resourceId;
    this.resourceType = resourceType;
    this.tripleBuffer = tripleBuffer;
    this.manager = manager;

    const buffers = this.tripleBuffer.buffers;
    const schema = (LocalResourceClass as unknown as ILocalResourceClass<Def>).resourceDef.schema;

    this.u32Views = [new Uint32Array(buffers[0]), new Uint32Array(buffers[1]), new Uint32Array(buffers[2])];
    this.f32Views = [new Float32Array(buffers[0]), new Float32Array(buffers[1]), new Float32Array(buffers[2])];

    this.vecViews = [];

    for (const propName in schema) {
      const prop = schema[propName];

      if (prop.size > 1 && prop.arrayType === Float32Array) {
        this.vecViews.push([
          new prop.arrayType(buffers[0], prop.byteOffset, prop.size),
          new prop.arrayType(buffers[1], prop.byteOffset, prop.size),
          new prop.arrayType(buffers[2], prop.byteOffset, prop.size),
        ]);
      }
    }
  }

  Object.defineProperties(LocalResourceClass, {
    name: { value: kebabToPascalCase(name) },
    resourceDef: { value: resourceDef },
  });

  Object.defineProperties(LocalResourceClass.prototype, {
    resourceDef: { value: resourceDef },
    load: {
      value() {
        return Promise.resolve();
      },
    },
    dispose: { value() {} },
  });

  let vecViewIndex = 0;

  for (const propName in schema) {
    const prop = schema[propName];

    if (prop.size > 1 && prop.arrayType === Float32Array) {
      defineProp(LocalResourceClass, prop, propName, vecViewIndex++);
    } else {
      defineProp(LocalResourceClass, prop, propName, -1);
    }
  }

  return LocalResourceClass as unknown as ILocalResourceClass<Def, ThreadContext>;
}
