import kebabToPascalCase from "../utils/kebabToPascalCase";
import { IResourceManager } from "./IResourceManager";
import { ResourceDefinition } from "./ResourceDefinition";

type ResourcePropValue<
  Def extends ResourceDefinition,
  Prop extends keyof Def["schema"],
  MutResource extends boolean
> = Def["schema"][Prop]["type"] extends "string"
  ? string
  : Def["schema"][Prop]["type"] extends "ui32"
  ? number
  : Def["schema"][Prop]["type"] extends "arrayBuffer"
  ? ArrayBuffer
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
  ? // TODO: actually return the enum type instead of number
    // ex: Def["schema"][Prop]["enumType"][keyof Def["schema"][Prop]["enumType"]]
    number
  : Def["schema"][Prop]["type"] extends "ref"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Resource<Def["schema"][Prop]["resourceDef"], MutResource>
    : unknown
  : Def["schema"][Prop]["type"] extends "refArray"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Resource<Def["schema"][Prop]["resourceDef"]>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "selfRef"
  ? Resource<Def, MutResource>
  : never;

type ResourcePropValueMut<
  Def extends ResourceDefinition,
  Prop extends keyof Def["schema"],
  MutResource extends boolean
> = MutResource extends false
  ? Readonly<ResourcePropValue<Def, Prop, MutResource>>
  : Def["schema"][Prop]["mutable"] extends false
  ? Readonly<ResourcePropValue<Def, Prop, MutResource>>
  : ResourcePropValue<Def, Prop, MutResource>;

export type Resource<Def extends ResourceDefinition, MutResource extends boolean = true> = {
  readonly resourceId: number;
  readonly manager: IResourceManager;
} & { [Prop in keyof Def["schema"]]: ResourcePropValueMut<Def, Prop, MutResource> };

type RequiredProps<Def extends ResourceDefinition> = {
  [Prop in keyof Def["schema"]]: Def["schema"][Prop]["required"] extends true ? Prop : never;
}[keyof Def["schema"]];

type InitialResourceProps<Def extends ResourceDefinition> = {
  [Prop in keyof Def["schema"]]?: ResourcePropValue<Def, Prop, true>;
} & {
  [Prop in RequiredProps<Def>]: ResourcePropValue<Def, Prop, true>;
};

export interface ResourceClass<Def extends ResourceDefinition, MutResource extends boolean> {
  new (
    manager: IResourceManager,
    resourceIdOrProps?: MutResource extends false ? number : InitialResourceProps<Def>
  ): Resource<Def, MutResource>;
}

function defineStringProp(target: object, name: string, cursor: number, mutable: boolean) {
  const setter = mutable && {
    set(this: Resource<ResourceDefinition, boolean>, value: string) {
      this.manager.setString(this.resourceId, cursor, value);
    },
  };

  Object.defineProperty(target, name, {
    get(this: Resource<ResourceDefinition, boolean>): string {
      return this.manager.getString(this.resourceId, cursor);
    },
    ...setter,
  });
}

function defineU32Prop(target: object, name: string, cursor: number, mutable: boolean) {
  const setter = mutable && {
    set(this: Resource<ResourceDefinition, boolean>, value: number) {
      this.manager.setU32(this.resourceId, cursor, value);
    },
  };

  Object.defineProperty(target, name, {
    get(this: Resource<ResourceDefinition, boolean>): number {
      return this.manager.getU32(this.resourceId, cursor);
    },
    ...setter,
  });
}

export function createResourceClass<Def extends ResourceDefinition, MutResource extends boolean>(
  resourceDef: Def,
  mutable: MutResource
): ResourceClass<Def, MutResource> {
  const { name, schema } = resourceDef;

  const resourceClass = class {
    static resourceDef = resourceDef;
    constructor(public readonly manager: IResourceManager, public readonly resourceId: number) {}
  };

  Object.defineProperty(resourceClass, "name", { value: kebabToPascalCase(name) });

  let cursor = 0;

  for (const propName in schema) {
    const prop = schema[propName];

    switch (prop.type) {
      case "string":
        defineStringProp(resourceClass.prototype, propName, cursor, prop.mutable);
        break;
      case "u32":
        defineU32Prop(resourceClass.prototype, propName, cursor, prop.mutable);
        break;
      default:
        break;
    }

    cursor += prop.byteLength;
  }

  return resourceClass as ResourceClass<Def, MutResource>;
}
