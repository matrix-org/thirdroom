import { createTripleBuffer } from "../allocator/TripleBuffer";
import { RemoteResourceManager } from "../GameTypes";
import kebabToPascalCase from "../utils/kebabToPascalCase";
import {
  addResourceRef,
  createArrayBufferResource,
  createRemoteResource,
  createStringResource,
  removeResourceRef,
} from "./resource.game";
import {
  Schema,
  DefinedResource,
  ProcessedSchema,
  ResourceDefinition,
  RequiredProps,
  Resource,
} from "./ResourceDefinition";

type RemoteResourcePropValue<
  Def extends ResourceDefinition,
  Prop extends keyof Def["schema"]
> = Def["schema"][Prop]["type"] extends "string"
  ? string
  : Def["schema"][Prop]["type"] extends "u32"
  ? number
  : Def["schema"][Prop]["type"] extends "arrayBuffer"
  ? SharedArrayBuffer
  : Def["schema"][Prop]["type"] extends "bool"
  ? boolean
  : Def["schema"][Prop]["type"] extends "mat4"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "f32"
  ? number
  : Def["schema"][Prop]["type"] extends "rgba"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "rgb"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "vec2"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "vec3"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "quat"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "bitmask"
  ? number
  : Def["schema"][Prop]["type"] extends "enum"
  ? Def["schema"][Prop]["enumType"][keyof Def["schema"][Prop]["enumType"]]
  : Def["schema"][Prop]["type"] extends "ref"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]>
      : RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]> | undefined
    : unknown
  : Def["schema"][Prop]["type"] extends "refArray"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "refMap"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "selfRef"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? RemoteResourceInstance<Def>
      : RemoteResourceInstance<Def> | undefined
    : unknown
  : never;

type RemoteResourcePropValueMut<
  Def extends ResourceDefinition,
  Prop extends keyof Def["schema"]
> = Def["schema"][Prop]["mutable"] extends false
  ? Readonly<RemoteResourcePropValue<Def, Prop>>
  : RemoteResourcePropValue<Def, Prop>;

export type RemoteResourceInstance<Def extends ResourceDefinition> = RemoteResource & {
  [Prop in keyof Def["schema"]]: RemoteResourcePropValueMut<Def, Prop>;
} & { resourceType: Def["resourceType"] };

type InitialRemoteResourcePropValue<
  Def extends ResourceDefinition,
  Prop extends keyof Def["schema"]
> = Def["schema"][Prop]["type"] extends "string"
  ? string
  : Def["schema"][Prop]["type"] extends "u32"
  ? number
  : Def["schema"][Prop]["type"] extends "arrayBuffer"
  ? SharedArrayBuffer
  : Def["schema"][Prop]["type"] extends "bool"
  ? boolean
  : Def["schema"][Prop]["type"] extends "mat4"
  ? ArrayLike<number>
  : Def["schema"][Prop]["type"] extends "f32"
  ? number
  : Def["schema"][Prop]["type"] extends "rgba"
  ? ArrayLike<number>
  : Def["schema"][Prop]["type"] extends "rgb"
  ? ArrayLike<number>
  : Def["schema"][Prop]["type"] extends "vec2"
  ? ArrayLike<number>
  : Def["schema"][Prop]["type"] extends "vec3"
  ? ArrayLike<number>
  : Def["schema"][Prop]["type"] extends "quat"
  ? ArrayLike<number>
  : Def["schema"][Prop]["type"] extends "bitmask"
  ? number
  : Def["schema"][Prop]["type"] extends "enum"
  ? Def["schema"][Prop]["enumType"][keyof Def["schema"][Prop]["enumType"]]
  : Def["schema"][Prop]["type"] extends "ref"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]>
      : RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]> | undefined
    : unknown
  : Def["schema"][Prop]["type"] extends "refArray"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "refMap"
  ? {
      [key: number]: Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
        ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]>
        : never;
    }
  : Def["schema"][Prop]["type"] extends "selfRef"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? RemoteResourceInstance<Def>
      : RemoteResourceInstance<Def> | undefined
    : unknown
  : never;

export type InitialRemoteResourceProps<Def extends ResourceDefinition> = {
  [Prop in RequiredProps<Def>]: InitialRemoteResourcePropValue<Def, Prop>;
} & {
  [Prop in keyof Def["schema"]]?: InitialRemoteResourcePropValue<Def, Prop>;
};

export interface IRemoteResourceClass<Def extends ResourceDefinition = ResourceDefinition> {
  new (manager: RemoteResourceManager, props?: InitialRemoteResourceProps<Def>): RemoteResourceInstance<Def>;
  resourceDef: Def;
}

export interface RemoteResourceConstructor {
  new (manager: RemoteResourceManager, props: any): RemoteResource;
  resourceDef: ResourceDefinition;
}

export interface RemoteResource extends Resource {
  constructor: { name: string; resourceDef: ResourceDefinition };
  resourceDef: ResourceDefinition;
  resourceType: number;
  manager: RemoteResourceManager;
  initialized: boolean;
  byteView: Uint8Array;
  u32View: Uint32Array;
  f32View: Float32Array;
  vecViews: Float32Array[];
  addRef(): void;
  removeRef(): void;
  removeResourceRefs(): void;
}

export function defineRemoteResourceClass<T extends number, S extends Schema, Def extends DefinedResource<T, S>>(
  resourceDef: Def
): IRemoteResourceClass<Def> {
  const { name, schema, resourceType } = resourceDef;

  function RemoteResourceClass(
    this: RemoteResourceInstance<Def>,
    manager: RemoteResourceManager,
    // TODO: this probably shouldn't be optional when there are required props
    initialProps?: InitialRemoteResourceProps<Def>
  ) {
    this.manager = manager;
    this.resourceType = resourceType;
    this.resourceDef = resourceDef;
    this.initialized = false;
    const buffer = new ArrayBuffer(resourceDef.byteLength);
    this.tripleBuffer = createTripleBuffer(manager.ctx.gameToRenderTripleBufferFlags, resourceDef.byteLength);
    this.byteView = new Uint8Array(buffer);
    this.u32View = new Uint32Array(buffer);
    this.f32View = new Float32Array(buffer);
    this.vecViews = [];

    const schema = (RemoteResourceClass as unknown as IRemoteResourceClass<Def>).resourceDef.schema;

    const ctx = this.manager.ctx;
    const u32View = this.u32View;
    const f32View = this.f32View;

    for (const propName in schema) {
      const prop = schema[propName];
      const backRef = prop.backRef;
      const offset = prop.byteOffset / 4;
      const initialValue = initialProps && initialProps[propName] !== undefined ? initialProps[propName] : prop.default;

      if (initialValue === undefined) {
        continue;
      }

      if (prop.type === "string") {
        const resourceId = createStringResource(ctx, initialValue as string);
        addResourceRef(ctx, resourceId);
        u32View[offset] = resourceId;
      } else if (prop.type === "arrayBuffer") {
        const arrayBuffer = initialValue as SharedArrayBuffer;
        const resourceId = createArrayBufferResource(ctx, arrayBuffer);
        addResourceRef(ctx, resourceId);
        // TODO: Can probably make this a ref prop now.
        u32View[offset] = arrayBuffer.byteLength;
        u32View[offset + 1] = 0; // Immutable
        u32View[offset + 2] = resourceId;
      } else if (prop.type === "ref") {
        const resourceId = (initialValue as RemoteResource | undefined)?.eid || 0;

        if (!backRef && resourceId) {
          addResourceRef(ctx, resourceId);
        }

        u32View[offset] = resourceId;
      } else if (prop.type === "refArray") {
        const refArray = initialValue as RemoteResource[];

        for (let i = 0; i < refArray.length; i++) {
          const resourceId = refArray[i].eid;
          addResourceRef(ctx, resourceId);
          u32View[offset + i] = resourceId;
        }
      } else if (prop.type === "refMap") {
        const refMap = initialValue as { [key: number]: RemoteResource };

        for (const key in refMap) {
          const resourceId = refMap[key].eid;
          addResourceRef(ctx, resourceId);
          u32View[offset + Number(key)] = resourceId || 0;
        }
      } else if (prop.type === "bool") {
        u32View[offset] = (initialValue as boolean) ? 1 : 0;
      } else if (prop.size === 1) {
        if (prop.type === "f32") {
          f32View[offset] = initialValue as number;
        } else {
          u32View[offset] = initialValue as number;
        }
      } else {
        const arr = new Float32Array(buffer, prop.byteOffset, prop.size);
        arr.set(initialValue as Float32Array);
        this.vecViews.push(arr);
      }
    }

    this.eid = createRemoteResource(this.manager.ctx, this);
    this.manager.resourceIds.add(this.eid);
  }

  Object.defineProperties(RemoteResourceClass, {
    name: { value: kebabToPascalCase(name) },
    resourceDef: { value: resourceDef },
  });

  const refOffsets: number[] = [];

  for (const propName in schema) {
    const prop = schema[propName];

    if (prop.backRef) {
      continue;
    }

    const offset = prop.byteOffset / 4;

    if (prop.type === "ref" || prop.type === "string" || prop.type === "refArray" || prop.type === "refMap") {
      for (let i = 0; i < prop.size; i++) {
        refOffsets.push(offset + i);
      }
    } else if (prop.type === "arrayBuffer") {
      refOffsets.push(offset + 2);
    }
  }

  Object.defineProperties(RemoteResourceClass.prototype, {
    addRef: {
      value(this: RemoteResource) {
        addResourceRef(this.manager.ctx, this.eid);
      },
    },
    removeRef: {
      value(this: RemoteResource) {
        removeResourceRef(this.manager.ctx, this.eid);
      },
    },
    removeResourceRefs: {
      value(this: RemoteResource) {
        const ctx = this.manager.ctx;
        const refView = this.u32View;

        for (let i = 0; i < refOffsets.length; i++) {
          const offset = refOffsets[i];
          const resourceId = refView[offset];

          if (resourceId) {
            removeResourceRef(ctx, resourceId);
          }
        }
      },
    },
  });

  let vecViewIndex = 0;

  for (const propName in schema) {
    const prop = schema[propName];

    if (prop.size > 1 && prop.arrayType === Float32Array) {
      defineProp<T, S, Def>(RemoteResourceClass, prop, propName, vecViewIndex++);
    } else {
      defineProp<T, S, Def>(RemoteResourceClass, prop, propName, -1);
    }
  }

  return RemoteResourceClass as unknown as IRemoteResourceClass<Def>;
}

function defineProp<T extends number, S extends Schema, Def extends DefinedResource<T, S>>(
  RemoteResourceClass: Function,
  prop: ProcessedSchema<S>[Extract<keyof S, string>],
  propName: string,
  vecPropIndex: number
) {
  const offset = prop.byteOffset / 4;
  const size = prop.size;
  const backRef = prop.backRef;

  if (prop.type === "string") {
    const setter = prop.mutable
      ? {
          set(this: RemoteResourceInstance<Def>, value?: string) {
            const resourceId = this.u32View[offset];
            const curValue = resourceId ? this.manager.resourceMap.get(resourceId) || "" : "";

            if (curValue !== value) {
              if (resourceId) {
                removeResourceRef(this.manager.ctx, resourceId);
              }

              if (value) {
                const resourceId = createStringResource(this.manager.ctx, value);
                addResourceRef(this.manager.ctx, resourceId);
                this.u32View[offset] = resourceId;
              }
            }
          },
        }
      : undefined;

    Object.defineProperty(RemoteResourceClass.prototype, propName, {
      ...setter,
      get(this: RemoteResourceInstance<Def>) {
        const resourceId = this.u32View[offset];
        return this.manager.resourceMap.get(resourceId);
      },
    });
  } else if (prop.type === "arrayBuffer") {
    Object.defineProperty(RemoteResourceClass.prototype, propName, {
      get(this: RemoteResourceInstance<Def>) {
        const resourceId = this.u32View[offset + 2];
        return this.manager.resourceMap.get(resourceId);
      },
    });
  } else if (prop.type === "ref") {
    const setter = prop.mutable
      ? {
          set(this: RemoteResourceInstance<Def>, value?: RemoteResource) {
            const curResourceId = this.u32View[offset];
            const nextResourceId = value?.eid || 0;

            if (!backRef) {
              if (nextResourceId && nextResourceId !== curResourceId) {
                addResourceRef(this.manager.ctx, nextResourceId);
              }

              if (curResourceId && nextResourceId !== curResourceId) {
                removeResourceRef(this.manager.ctx, curResourceId);
              }
            }

            this.u32View[offset] = nextResourceId;
          },
        }
      : undefined;

    Object.defineProperty(RemoteResourceClass.prototype, propName, {
      ...setter,
      get(this: RemoteResourceInstance<Def>) {
        const resourceId = this.u32View[offset];
        return this.manager.resourceMap.get(resourceId);
      },
    });
  } else if (prop.type === "refArray") {
    const setter = prop.mutable
      ? {
          set(this: RemoteResourceInstance<Def>, value: RemoteResource[]) {
            const ctx = this.manager.ctx;
            const refView = this.u32View;

            for (let i = 0; i < value.length; i++) {
              addResourceRef(ctx, value[i].eid);
            }

            for (let i = 0; i < size; i++) {
              const resourceId = refView[offset + i];

              if (resourceId) {
                removeResourceRef(ctx, resourceId);
              }

              refView[offset + i] = 0;
            }

            for (let i = 0; i < value.length && i < size; i++) {
              refView[offset + i] = value[i].eid || 0;
            }
          },
        }
      : undefined;

    Object.defineProperty(RemoteResourceClass.prototype, propName, {
      ...setter,
      get(this: RemoteResourceInstance<Def>) {
        const arr = this.u32View;
        const resources = [];
        const resourceMap = this.manager.resourceMap;

        for (let i = offset; i < offset + size; i++) {
          if (arr[i] === 0) {
            break;
          }

          const resource = resourceMap.get(arr[i]);

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
          set(this: RemoteResourceInstance<Def>, value: { [key: number]: RemoteResource }) {
            const ctx = this.manager.ctx;
            const refView = this.u32View;

            for (const key in value) {
              addResourceRef(ctx, value[key].eid);
            }

            for (let i = 0; i < size; i++) {
              const resourceId = refView[offset + i];

              if (resourceId) {
                removeResourceRef(ctx, resourceId);
              }

              refView[offset + i] = 0;
            }

            for (const key in value) {
              refView[offset + Number(key)] = value[key].eid || 0;
            }
          },
        }
      : undefined;

    Object.defineProperty(RemoteResourceClass.prototype, propName, {
      ...setter,
      get(this: RemoteResourceInstance<Def>) {
        const arr = this.u32View;
        const resources = [];

        for (let i = offset; i < offset + size; i++) {
          if (arr[i]) {
            resources.push(this.manager.resourceMap.get(arr[i]));
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
          set(this: RemoteResourceInstance<Def>, value: boolean) {
            this.u32View[offset] = value ? 1 : 0;
          },
        }
      : undefined;

    Object.defineProperty(RemoteResourceClass.prototype, propName, {
      ...setter,
      get(this: RemoteResourceInstance<Def>) {
        return !!this.u32View[offset];
      },
    });
  } else if (prop.size === 1) {
    if (prop.type === "f32") {
      const setter = prop.mutable
        ? {
            set(this: RemoteResourceInstance<Def>, value: number) {
              this.f32View[offset] = value;
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResourceInstance<Def>) {
          return this.f32View[offset];
        },
      });
    } else {
      const setter = prop.mutable
        ? {
            set(this: RemoteResourceInstance<Def>, value: number) {
              this.u32View[offset] = value;
            },
          }
        : undefined;

      Object.defineProperty(RemoteResourceClass.prototype, propName, {
        ...setter,
        get(this: RemoteResourceInstance<Def>) {
          return this.u32View[offset];
        },
      });
    }
  } else {
    const setter = prop.mutable
      ? {
          set(this: RemoteResourceInstance<Def>, value: Float32Array) {
            this.vecViews[vecPropIndex].set(value);
          },
        }
      : undefined;

    Object.defineProperty(RemoteResourceClass.prototype, propName, {
      ...setter,
      get(this: RemoteResourceInstance<Def>) {
        return this.vecViews[vecPropIndex];
      },
    });
  }
}
