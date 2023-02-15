import { mat4, quat, vec2, vec3, vec4 } from "gl-matrix";

import { TripleBuffer } from "../allocator/TripleBuffer";
import { TypedArray32, TypedArrayConstructor32 } from "../utils/typedarray";
import { BaseThreadContext } from "../module/module.common";
import { GLTFResource } from "../gltf/gltf.game";

export interface ResourceDefinition {
  name: string;
  resourceType: number;
  schema: {
    [key: string]: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown> & { byteOffset: number };
  };
  byteLength: number;
}

export type Schema = {
  [key: string]: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>;
};

export type ProcessedSchema<S extends Schema> = {
  [K in keyof S]: S[K] & { byteOffset: number };
};

export interface ResourcePropDef<
  Key extends string,
  DefaultValue,
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
  mutableScript: boolean;
  script: boolean;
  default: DefaultValue;
  enumType: Enum;
  resourceDef: Def;
  min?: number;
  max?: number;
  minExclusive?: number;
  maxExclusive?: number;
  backRef: boolean;
}

function createPropDef<
  Type extends string,
  Required extends boolean,
  Mutable extends boolean,
  EnumType,
  ResourceDef,
  Defaults extends {
    type: Type;
    required: Required;
    mutable: Mutable;
    default: unknown;
    size?: number;
    arrayType: TypedArrayConstructor32;
    enumType?: EnumType;
    resourceDef?: ResourceDef;
  },
  Options extends {
    default?: Defaults["default"];
    mutable?: boolean;
    mutableScript?: boolean;
    required?: boolean;
    script?: boolean;
    min?: number;
    max?: number;
    minExclusive?: number;
    maxExclusive?: number;
    backRef?: boolean;
    size?: number;
  }
>(defaults: Defaults, options?: Options) {
  return {
    mutableScript: options?.mutable !== undefined ? options.mutable : defaults.mutable,
    script: false,
    resourceDef: undefined,
    backRef: false,
    size: 1,
    ...defaults,
    ...options,
  } as ResourcePropDef<
    Defaults["type"],
    Defaults["default"],
    Options["mutable"] extends boolean ? Options["mutable"] : Defaults["mutable"],
    Options["required"] extends boolean ? Options["required"] : Defaults["required"],
    Defaults["enumType"],
    Defaults["resourceDef"]
  >;
}

interface BasePropOptions {
  mutable?: boolean;
  mutableScript?: boolean;
  required?: boolean;
  script?: boolean;
}

interface DefaultPropOptions<DefaultValue> extends BasePropOptions {
  default?: DefaultValue;
}

type NoDefaultPropOptions<DefaultValue> = {
  mutable?: boolean;
  mutableScript?: boolean;
  script?: boolean;
} & (
  | {
      required: true;
      default?: DefaultValue;
    }
  | { required?: false; default: DefaultValue }
);

interface ScalarPropOptions extends DefaultPropOptions<number> {
  min?: number;
  max?: number;
  minExclusive?: number;
  maxExclusive?: number;
}

type VectorPropOptions = DefaultPropOptions<ArrayLike<number>>;

interface RefPropOptions extends BasePropOptions {
  backRef?: boolean;
}

interface RefArrayPropOptions extends RefPropOptions {
  size: number;
}

function createBoolPropDef<O extends DefaultPropOptions<boolean>>(options?: O) {
  return createPropDef(
    {
      type: "bool",
      // TODO: look into byte alignment to make this smaller like using a Uin8tArray
      arrayType: Uint32Array,
      mutable: true,
      required: false,
      default: false,
    },
    options
  );
}

function createU32PropDef<O extends ScalarPropOptions>(options?: O) {
  return createPropDef(
    {
      type: "u32",
      arrayType: Uint32Array,
      mutable: true,
      required: false,
      default: 0,
    },
    options
  );
}

function createF32PropDef<O extends ScalarPropOptions>(options?: O) {
  return createPropDef(
    {
      type: "f32",
      arrayType: Float32Array,
      mutable: true,
      required: false,
      default: 0,
    },
    options
  );
}

function createVec2PropDef<O extends VectorPropOptions>(options?: O) {
  return createPropDef(
    {
      type: "vec2",
      arrayType: Float32Array,
      size: 2,
      mutable: true,
      required: false,
      default: vec2.create() as ArrayLike<number>,
    },
    options
  );
}

function createVec3PropDef<O extends VectorPropOptions>(options?: O) {
  return createPropDef(
    {
      type: "vec3",
      arrayType: Float32Array,
      size: 3,
      mutable: true,
      required: false,
      default: vec3.create() as ArrayLike<number>,
    },
    options
  );
}

function createRGBPropDef<O extends VectorPropOptions>(options?: O) {
  return createPropDef(
    {
      type: "rgb",
      arrayType: Float32Array,
      size: 3,
      mutable: true,
      required: false,
      default: vec3.create() as ArrayLike<number>,
    },
    options
  );
}

function createRGBAPropDef<O extends VectorPropOptions>(options?: O) {
  return createPropDef(
    {
      type: "rgba",
      arrayType: Float32Array,
      size: 4,
      mutable: true,
      required: false,
      default: vec4.create() as ArrayLike<number>,
    },
    options
  );
}

function createQuatPropDef<O extends VectorPropOptions>(options?: O) {
  return createPropDef(
    {
      type: "quat",
      arrayType: Float32Array,
      size: 4,
      mutable: true,
      required: false,
      default: quat.create() as ArrayLike<number>,
    },
    options
  );
}

function createMat4PropDef<O extends VectorPropOptions>(options?: O) {
  return createPropDef(
    {
      type: "mat4",
      arrayType: Float32Array,
      size: 16,
      mutable: true,
      required: false,
      default: mat4.create() as ArrayLike<number>,
    },
    options
  );
}

function createBitmaskPropDef<O extends DefaultPropOptions<number>>(options?: O) {
  return createPropDef(
    {
      type: "bitmask",
      arrayType: Uint32Array,
      size: 1,
      mutable: true,
      required: false,
      default: 0,
    },
    options
  );
}

function createEnumPropDef<T, O extends NoDefaultPropOptions<Extract<T[keyof T], number>>>(enumType: T, options?: O) {
  return createPropDef(
    {
      type: "enum",
      arrayType: Uint32Array,
      mutable: true,
      required: false,
      default: 0,
      enumType,
    },
    options
  );
}

function createStringPropDef<O extends DefaultPropOptions<string>>(options?: O) {
  return createPropDef(
    {
      type: "string",
      arrayType: Uint32Array,
      mutable: true,
      required: false,
      default: "",
    },
    options
  );
}

function createArrayBufferPropDef<O extends { script?: boolean }>(options?: O) {
  return createPropDef(
    {
      type: "arrayBuffer",
      size: 3,
      arrayType: Uint32Array,
      mutable: false,
      required: true,
      default: undefined,
    },
    options
  );
}

function createRefPropDef<Def extends ResourceDefinition | string, O extends RefPropOptions>(
  resourceDef: Def,
  options?: O
) {
  return createPropDef(
    {
      type: "ref",
      arrayType: Uint32Array,
      mutable: true,
      required: false,
      default: 0,
      resourceDef,
    },
    options
  );
}

function createRefArrayPropDef<Def extends ResourceDefinition | string, O extends RefArrayPropOptions>(
  resourceDef: Def,
  options: O
) {
  return createPropDef(
    {
      type: "refArray",
      arrayType: Uint32Array,
      mutable: true,
      required: false,
      default: new Uint32Array(options.size),
      resourceDef,
    },
    options
  );
}

function createRefMapPropDef<Def extends ResourceDefinition | string, O extends RefArrayPropOptions>(
  resourceDef: Def,
  options: O
) {
  return createPropDef(
    {
      type: "refMap",
      arrayType: Uint32Array,
      mutable: true,
      required: false,
      default: new Uint32Array(options.size),
      resourceDef,
    },
    options
  );
}

function createSelfRefPropDef<O extends RefPropOptions>(options?: O) {
  return createPropDef(
    {
      type: "selfRef",
      arrayType: Uint32Array,
      mutable: true,
      required: false,
      default: 0,
    },
    options
  );
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
  arrayBuffer: createArrayBufferPropDef,
  ref: createRefPropDef,
  refArray: createRefArrayPropDef,
  refMap: createRefMapPropDef,
  selfRef: createSelfRefPropDef,
};

export interface DefinedResource<T extends number, S extends Schema> extends ResourceDefinition {
  resourceType: T;
  schema: ProcessedSchema<S>;
}

export const defineResource = <T extends number, S extends Schema>(
  name: string,
  resourceType: T,
  schema: S
): DefinedResource<T, S> => {
  const resourceDef: DefinedResource<T, S> = {
    name,
    resourceType,
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
        backRef: prop.backRef,
      }) as S[Extract<keyof S, string>];
      (schema[propName] as ProcessedSchema<S>[Extract<keyof S, string>]).byteOffset = cursor;
    } else {
      prop.byteOffset = cursor;
    }

    cursor += prop.arrayType.BYTES_PER_ELEMENT * prop.size;
  }

  resourceDef.byteLength = cursor;

  return resourceDef;
};

type RemoteResourcePropValue<
  ThreadContext extends BaseThreadContext,
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
      ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext>
      : RemoteResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext> | undefined
    : unknown
  : Def["schema"][Prop]["type"] extends "refArray"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "refMap"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "selfRef"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? RemoteResourceInstance<Def, ThreadContext>
      : RemoteResourceInstance<Def, ThreadContext> | undefined
    : unknown
  : never;

type RemoteResourcePropValueMut<
  ThreadContext extends BaseThreadContext,
  Def extends ResourceDefinition,
  Prop extends keyof Def["schema"]
> = Def["schema"][Prop]["mutable"] extends false
  ? Readonly<RemoteResourcePropValue<ThreadContext, Def, Prop>>
  : RemoteResourcePropValue<ThreadContext, Def, Prop>;

type LocalResourcePropValue<
  ThreadContext extends BaseThreadContext,
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
      ? LocalResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext>
      : LocalResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext> | undefined
    : unknown
  : Def["schema"][Prop]["type"] extends "refArray"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? LocalResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "refMap"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? LocalResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "selfRef"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? LocalResourceInstance<Def, ThreadContext>
      : LocalResourceInstance<Def, ThreadContext> | undefined
    : unknown
  : never;

export interface Resource {
  eid: number;
  tripleBuffer: TripleBuffer;
}

export interface RemoteResource<ThreadContext extends BaseThreadContext> extends Resource {
  constructor: { name: string; resourceDef: ResourceDefinition };
  resourceDef: ResourceDefinition;
  resourceType: number;
  manager: IRemoteResourceManager<ThreadContext>;
  __props: { [key: string]: TypedArray32 };
  initialized: boolean;
  byteView: Uint8Array;
  refView: Uint32Array;
  prevRefs: number[];
  translationIndices: Uint32Array;
  translationValues: Uint32Array;
  ptr: number;
  addRef(): void;
  removeRef(): void;
}

export type RemoteResourceInstance<
  Def extends ResourceDefinition,
  ThreadContext extends BaseThreadContext
> = RemoteResource<ThreadContext> & {
  [Prop in keyof Def["schema"]]: RemoteResourcePropValueMut<ThreadContext, Def, Prop>;
} & { resourceType: Def["resourceType"] };

export interface IRemoteResourceClass<
  Def extends ResourceDefinition = ResourceDefinition,
  ThreadContext extends BaseThreadContext = BaseThreadContext
> {
  new (
    manager: IRemoteResourceManager<ThreadContext>,
    props?: ResourceData | InitialRemoteResourceProps<ThreadContext, Def>
  ): RemoteResourceInstance<Def, ThreadContext>;
  resourceDef: Def;
}

export interface LocalResource<ThreadContext extends BaseThreadContext = BaseThreadContext> extends Resource {
  resourceType: number;
  manager: ILocalResourceManager;
  u32Views: Uint32Array[];
  f32Views: Float32Array[];
  vecViews: Float32Array[][];
  load(ctx: ThreadContext): void;
  dispose(ctx: ThreadContext): void;
}

export type LocalResourceInstance<
  Def extends ResourceDefinition,
  ThreadContext extends BaseThreadContext
> = LocalResource<ThreadContext> & {
  readonly [Prop in keyof Def["schema"]]: LocalResourcePropValue<ThreadContext, Def, Prop>;
} & { resourceType: Def["resourceType"]; resourceDef: Def };

export interface ILocalResourceClass<
  Def extends ResourceDefinition = ResourceDefinition,
  ThreadContext extends BaseThreadContext = BaseThreadContext
> {
  new (manager: ILocalResourceManager, resourceId: number, tripleBuffer: TripleBuffer): LocalResourceInstance<
    Def,
    ThreadContext
  >;
  resourceDef: Def;
}

export interface ILocalResourceConstructor<ThreadContext extends BaseThreadContext> {
  new (manager: ILocalResourceManager, resourceId: number, tripleBuffer: TripleBuffer): LocalResource<ThreadContext>;
  resourceDef: ResourceDefinition;
}

export type IResourceClass<ThreadContext extends BaseThreadContext> =
  | IRemoteResourceClass<ResourceDefinition>
  | ILocalResourceClass<ResourceDefinition, ThreadContext>;

type RequiredProps<Def extends ResourceDefinition> = {
  [Prop in keyof Def["schema"]]: Def["schema"][Prop]["required"] extends true ? Prop : never;
}[keyof Def["schema"]];

type InitialRemoteResourcePropValue<
  ThreadContext extends BaseThreadContext,
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
      ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext>
      : RemoteResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext> | undefined
    : unknown
  : Def["schema"][Prop]["type"] extends "refArray"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "refMap"
  ? {
      [key: number]: Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
        ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext>
        : never;
    }
  : Def["schema"][Prop]["type"] extends "selfRef"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? RemoteResourceInstance<Def, ThreadContext>
      : RemoteResourceInstance<Def, ThreadContext> | undefined
    : unknown
  : never;

export type InitialRemoteResourceProps<ThreadContext extends BaseThreadContext, Def extends ResourceDefinition> = {
  [Prop in RequiredProps<Def>]: InitialRemoteResourcePropValue<ThreadContext, Def, Prop>;
} & {
  [Prop in keyof Def["schema"]]?: InitialRemoteResourcePropValue<ThreadContext, Def, Prop>;
};

export interface ResourceData {
  ptr: number;
  buffer: ArrayBuffer;
  tripleBuffer: TripleBuffer;
}

export interface ResourceManagerGLTFCacheEntry {
  refCount: number;
  promise: Promise<GLTFResource>;
}

export interface IRemoteResourceManager<ThreadContext extends BaseThreadContext> {
  getCachedGLTF(uri: string): Promise<GLTFResource> | undefined;
  cacheGLTF(uri: string, promise: Promise<GLTFResource>): void;
  removeGLTFRef(uri: string): boolean;
  getString(store: Uint32Array): string;
  setString(value: string | undefined, store: Uint32Array): void;
  getArrayBuffer(store: Uint32Array): SharedArrayBuffer;
  setArrayBuffer(value: SharedArrayBuffer | undefined, store: Uint32Array): void;
  initArrayBuffer(store: Uint32Array): void;
  allocateResource(resourceDef: ResourceDefinition): ResourceData;
  createResource(resource: RemoteResource<ThreadContext>): number;
  removeResourceRefs(resourceId: number): boolean;
  getRef<T extends RemoteResource<ThreadContext>>(store: Uint32Array): T | undefined;
  setRef(value: RemoteResource<ThreadContext> | undefined, store: Uint32Array, backRef: boolean): void;
  setRefArray(values: RemoteResource<ThreadContext>[], store: Uint32Array): void;
  setRefMap(values: { [key: number]: RemoteResource<ThreadContext> }, store: Uint32Array): void;
  getRefArrayItem<T extends RemoteResource<ThreadContext>>(index: number, store: Uint32Array): T | undefined;
  addRef(resourceId: number): void;
  removeRef(resourceId: number): void;
}

export type LocalResourceTypes = string | SharedArrayBuffer | LocalResource;

export interface ILocalResourceManager {
  readBufferIndex: number;
  resources: Map<number, LocalResourceTypes>;
}
