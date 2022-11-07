import { mat4, quat, vec2, vec3, vec4 } from "gl-matrix";

import { TripleBuffer } from "../allocator/TripleBuffer";
import { TypedArrayConstructor32 } from "../allocator/types";

export interface ResourceDefinition<S extends Schema = Schema> {
  name: string;
  schema: ProcessedSchema<S>;
  byteLength: number;
}

interface Schema {
  [key: string]: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>;
}

type ProcessedSchema<S extends Schema> = {
  [K in keyof S]: S[K] & { byteOffset: number };
};

export interface ResourcePropDef<
  Key extends string,
  Value,
  Mut extends boolean,
  Req extends boolean,
  Enum = undefined,
  Def = undefined
> {
  type: Key;
  size: number;
  arrayType: TypedArrayConstructor32;
  required: Req;
  mutable: Mut;
  script: boolean;
  default: Value;
  enumType?: Enum;
  resourceDef?: Def;
  min?: number;
  max?: number;
  minExclusive?: number;
  maxExclusive?: number;
}

function createBoolPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: boolean;
  mutable?: Mut;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"bool", boolean, Mut | true, Req | false> {
  return {
    type: "bool",
    size: 1,
    // TODO: look into byte alignment to make this smaller like using a Uin8tArray
    arrayType: Uint32Array,
    mutable: true,
    required: false,
    script: false,
    default: false,
    ...options,
  };
}

function createU32PropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: number;
  mutable?: Mut;
  required?: Req;
  script?: boolean;
  min?: number;
  max?: number;
  minExclusive?: number;
  maxExclusive?: number;
}): ResourcePropDef<"u32", number, Mut | true, Req | false> {
  return {
    type: "u32",
    size: 1,
    arrayType: Uint32Array,
    mutable: true,
    required: false,
    script: false,
    default: 0,
    ...options,
  };
}

function createF32PropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: number;
  mutable?: Mut;
  required?: Req;
  script?: boolean;
  min?: number;
  max?: number;
  minExclusive?: number;
  maxExclusive?: number;
}): ResourcePropDef<"f32", number, Mut | true, Req | false> {
  return {
    type: "f32",
    size: 1,
    arrayType: Float32Array,
    mutable: true,
    required: false,
    script: false,
    default: 0,
    ...options,
  };
}

function createVec2PropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: ArrayLike<number>;
  mutable?: Mut;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"vec2", ArrayLike<number>, Mut | true, Req | false> {
  return {
    type: "vec2",
    size: 2,
    arrayType: Float32Array,
    mutable: true,
    required: false,
    script: false,
    default: vec2.create(),
    ...options,
  };
}

function createVec3PropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: ArrayLike<number>;
  mutable?: Mut;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"vec3", ArrayLike<number>, Mut | true, Req | false> {
  return {
    type: "vec3",
    size: 3,
    arrayType: Float32Array,
    mutable: true,
    required: false,
    script: false,
    default: vec3.create(),
    ...options,
  };
}

function createRGBPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: ArrayLike<number>;
  mutable?: Mut;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"rgb", ArrayLike<number>, Mut | true, Req | false> {
  return {
    type: "rgb",
    size: 3,
    arrayType: Float32Array,
    mutable: true,
    required: false,
    script: false,
    default: vec3.create(),
    ...options,
  };
}

function createRGBAPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: ArrayLike<number>;
  mutable?: Mut;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"rgba", ArrayLike<number>, Mut | true, Req | false> {
  return {
    type: "rgba",
    size: 4,
    arrayType: Float32Array,
    mutable: true,
    required: false,
    script: false,
    default: vec4.create(),
    ...options,
  };
}

function createQuatPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: ArrayLike<number>;
  mutable?: Mut;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"quat", ArrayLike<number>, Mut | true, Req | false> {
  return {
    type: "quat",
    size: 4,
    arrayType: Float32Array,
    mutable: true,
    required: false,
    script: false,
    default: quat.create(),
    ...options,
  };
}

function createMat4PropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: ArrayLike<number>;
  mutable?: Mut;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"mat4", ArrayLike<number>, Mut | true, Req | false> {
  return {
    type: "mat4",
    size: 16,
    arrayType: Float32Array,
    mutable: true,
    required: false,
    script: false,
    default: mat4.create(),
    ...options,
  };
}

function createBitmaskPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: number;
  mutable?: Mut;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"bitmask", number, Mut | true, Req | false> {
  return {
    type: "bitmask",
    size: 1,
    arrayType: Uint32Array,
    mutable: true,
    required: false,
    script: false,
    default: 0,
    ...options,
  };
}

function createEnumPropDef<T, Mut extends boolean, Req extends boolean>(
  enumType: T,
  options: {
    default?: T[keyof T];
    mutable?: Mut;
    required?: Req;
    script?: boolean;
  }
): ResourcePropDef<"enum", T[keyof T] | undefined, Mut | true, Req | false, T> {
  return {
    type: "enum",
    enumType,
    size: 1,
    arrayType: Uint32Array,
    mutable: true,
    required: false,
    script: false,
    default: undefined,
    ...options,
  };
}

function createStringPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: string;
  mutable?: Mut;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"string", string, Mut | true, Req | false> {
  return {
    type: "string",
    size: 1,
    arrayType: Uint32Array,
    mutable: true,
    required: false,
    script: false,
    default: "",
    ...options,
  };
}

function createArrayBufferPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: number;
  mutable?: Mut;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"arraybuffer", number, Mut | true, Req | false> {
  return {
    type: "arraybuffer",
    size: 1,
    arrayType: Uint32Array,
    mutable: true,
    required: false,
    script: false,
    default: 0,
    ...options,
  };
}

function createRefPropDef<Def extends ResourceDefinition, Mut extends boolean, Req extends boolean>(
  resourceDef: Def,
  options?: {
    mutable?: Mut;
    required?: Req;
    script?: boolean;
  }
): ResourcePropDef<"ref", number, Mut | true, Req | false, undefined, Def> {
  return {
    type: "ref",
    size: 1,
    arrayType: Uint32Array,
    resourceDef,
    mutable: true,
    required: false,
    script: false,
    default: 0,
    ...options,
  };
}

function createRefArrayPropDef<Def extends ResourceDefinition | string, Mut extends boolean, Req extends boolean>(
  resourceDef: Def,
  options: {
    size: number;
    mutable?: Mut;
    required?: Req;
    script?: boolean;
  }
): ResourcePropDef<"refArray", ArrayLike<number>, Mut | true, Req | false, undefined, Def> {
  const { size, ...rest } = options;
  return {
    type: "refArray",
    size,
    arrayType: Uint32Array,
    resourceDef,
    mutable: true,
    required: false,
    script: false,
    default: new Uint32Array(size),
    ...rest,
  };
}

function createSelfRefPropDef<Def extends ResourceDefinition, Mut extends boolean, Req extends boolean>(options?: {
  mutable?: Mut;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"selfRef", number, Mut | true, Req | false, undefined, Def> {
  return {
    type: "selfRef",
    size: 1,
    arrayType: Uint32Array,
    mutable: true,
    required: false,
    script: false,
    default: 0,
    ...options,
  };
}

export const PropType = {
  bool: createBoolPropDef,
  u32: createU32PropDef,
  f32: createF32PropDef,
  vec2: createVec2PropDef,
  vec3: createVec3PropDef,
  rgb: createRGBPropDef,
  rgba: createRGBAPropDef,
  quat: createQuatPropDef,
  mat4: createMat4PropDef,
  bitmask: createBitmaskPropDef,
  enum: createEnumPropDef,
  string: createStringPropDef,
  arraybuffer: createArrayBufferPropDef,
  ref: createRefPropDef,
  refArray: createRefArrayPropDef,
  selfRef: createSelfRefPropDef,
};

export const defineResource = <S extends Schema>(name: string, schema: S): ResourceDefinition<S> => {
  const resourceDef: ResourceDefinition<S> = {
    name,
    schema: schema as unknown as ProcessedSchema<S>,
    byteLength: 0,
  };

  let cursor = 0;

  for (const propName in resourceDef.schema) {
    const prop = resourceDef.schema[propName];

    if (prop.type === "selfRef") {
      schema[propName] = PropType.ref(resourceDef, {
        mutable: prop.mutable,
        required: prop.required,
        script: prop.script,
      }) as unknown as any;
    }

    prop.byteOffset = cursor;
    cursor += prop.arrayType.BYTES_PER_ELEMENT * prop.size;
  }

  resourceDef.byteLength = cursor;

  return resourceDef as unknown as ResourceDefinition<S>;
};

type ResourcePropValue<
  Def extends ResourceDefinition,
  Prop extends keyof Def["schema"],
  MutResource extends boolean
> = Def["schema"][Prop]["type"] extends "string"
  ? string
  : Def["schema"][Prop]["type"] extends "u32"
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
  resourceId: number;
  tripleBuffer: TripleBuffer;
} & { [Prop in keyof Def["schema"]]: ResourcePropValueMut<Def, Prop, MutResource> };

export type RemoteResource<Def extends ResourceDefinition> = Resource<Def, true> & {
  manager: IRemoteResourceManager;
  __props: { [key: string]: any };
  initialized: boolean;
  byteView: Uint8Array;
  translationIndices: Uint32Array;
  translationValues: Uint32Array;
  byteOffset: number;
  addRef(): void;
  removeRef(): void;
} & { constructor: { name: string; resourceDef: Def } };

export type LocalResource<Def extends ResourceDefinition> = Resource<Def, false> & {
  manager: ILocalResourceManager;
  __props: { [key: string]: any };
};

type RequiredProps<Def extends ResourceDefinition> = {
  [Prop in keyof Def["schema"]]: Def["schema"][Prop]["required"] extends true ? Prop : never;
}[keyof Def["schema"]];

export type InitialResourceProps<Def extends ResourceDefinition> = {
  [Prop in keyof Def["schema"]]?: ResourcePropValue<Def, Prop, true>;
} & {
  [Prop in RequiredProps<Def>]: ResourcePropValue<Def, Prop, true>;
};

export interface RemoteResourceStringStore {
  prevPtr: number;
  value: string;
  view: Uint32Array;
  resourceIdView: Uint32Array;
}

export interface IRemoteResourceManager {
  resources: RemoteResource<ResourceDefinition>[];
  getString(store: RemoteResourceStringStore): string;
  setString(value: string | undefined, store: RemoteResourceStringStore): void;
  createResource<Def extends ResourceDefinition>(
    resourceDef: Def,
    props: InitialResourceProps<Def>
  ): RemoteResource<Def>;
  getResource<Def extends ResourceDefinition>(resourceDef: Def, resourceId: number): RemoteResource<Def> | undefined;
  addRef(resourceId: number): void;
  removeRef(resourceId: number): void;
}

export interface ILocalResourceManager {
  getResource<Def extends ResourceDefinition>(resourceDef: Def, resourceId: number): LocalResource<Def> | undefined;
  getString(resourceId: number): string;
}
