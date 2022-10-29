import { mat4, quat, vec2, vec3, vec4 } from "gl-matrix";

export interface ResourceDefinition<S extends Schema = Schema> {
  name: string;
  schema: S;
}

interface Schema {
  [key: string]: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>;
}

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
  byteLength: number;
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
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
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
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
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
    byteLength: Float32Array.BYTES_PER_ELEMENT,
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
    byteLength: Float32Array.BYTES_PER_ELEMENT,
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
    byteLength: Float32Array.BYTES_PER_ELEMENT,
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
    byteLength: Float32Array.BYTES_PER_ELEMENT,
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
    byteLength: Float32Array.BYTES_PER_ELEMENT,
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
    byteLength: Float32Array.BYTES_PER_ELEMENT,
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
    byteLength: Float32Array.BYTES_PER_ELEMENT,
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
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
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
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
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
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
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
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
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
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
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
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
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
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
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
  const resourceDef = {
    name,
    schema,
  };

  for (const propName in schema) {
    const prop = schema[propName];

    if (prop.type === "selfRef") {
      schema[propName] = PropType.ref(resourceDef, {
        mutable: prop.mutable,
        required: prop.required,
        script: prop.script,
      }) as unknown as any;
    }
  }

  return {
    name,
    schema,
  };
};
