export interface PropStoreContext {
  buffer: ArrayBuffer | SharedArrayBuffer;
  maxEntities: number;
}

export interface MapStore<T> {
  get(key: number): T | undefined;
  set(key: number, value: T): void;
  delete(key: number): void;
}

export type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;

export type PropStoreFactory<Store> = (ctx: PropStoreContext) => {
  byteLength: number;
  create(buffer: SharedArrayBuffer, byteOffset: number): Store;
};

const $propType = Symbol("propType");

export interface RequiredPropTypeDefinition<T> {
  [$propType]: boolean;
  name: string;
  factory: PropStoreFactory<T>;
  isRequired: boolean;
}

export interface UnrequiredPropTypeDefinition<T> {
  [$propType]: boolean;
  name: string;
  factory: PropStoreFactory<T>;
  isRequired: boolean;
  get required(): RequiredPropTypeDefinition<T>;
}

export type PropTypeDefinition<T> = RequiredPropTypeDefinition<T> | UnrequiredPropTypeDefinition<T>;

function definePropType<T>(name: string, factory: PropStoreFactory<T>): UnrequiredPropTypeDefinition<T> {
  return {
    [$propType]: true,
    name,
    factory,
    isRequired: false,
    get required() {
      return {
        [$propType]: true,
        name,
        factory,
        isRequired: true,
      };
    },
  };
}

const addTypedArrayStore =
  <C extends TypedArrayConstructor>(typedArrayConstructor: C) =>
  (ctx: PropStoreContext) => ({
    byteLength: typedArrayConstructor.BYTES_PER_ELEMENT * ctx.maxEntities,
    create: (buffer: SharedArrayBuffer, byteOffset: number): InstanceType<C> =>
      new typedArrayConstructor(buffer, byteOffset, ctx.maxEntities) as InstanceType<C>,
  });

const addTypedArrayArrayStore =
  <C extends TypedArrayConstructor>(typedArrayConstructor: C, size: number) =>
  (ctx: PropStoreContext) => ({
    byteLength: typedArrayConstructor.BYTES_PER_ELEMENT * size * ctx.maxEntities,
    create: (buffer: SharedArrayBuffer, byteOffset: number): InstanceType<C>[] =>
      Array.from(
        { length: ctx.maxEntities },
        (_, index) =>
          new typedArrayConstructor(
            buffer,
            byteOffset + index * typedArrayConstructor.BYTES_PER_ELEMENT,
            ctx.maxEntities
          ) as InstanceType<C>
      ),
  });

function createMapStore<T>(): MapStore<T> {
  const store: Map<number, T> = new Map();

  return {
    get(key: number): T | undefined {
      return store.get(key);
    },
    set(key: number, value: T): void {
      store.set(key, value);
    },
    delete(key: number): void {
      store.delete(key);
    },
  };
}

const addMapStore =
  <T>() =>
  (ctx: PropStoreContext) => ({
    byteLength: 0,
    create: () => createMapStore<T>(),
  });

export const PropTypes = {
  i8: definePropType("i8", addTypedArrayStore(Int8Array)),
  ui8: definePropType("ui8", addTypedArrayStore(Uint8Array)),
  ui8c: definePropType("ui8c", addTypedArrayStore(Uint8ClampedArray)),
  i16: definePropType("i16", addTypedArrayStore(Int16Array)),
  ui16: definePropType("ui16", addTypedArrayStore(Uint16Array)),
  i32: definePropType("i32", addTypedArrayStore(Int32Array)),
  ui32: definePropType("ui32", addTypedArrayStore(Uint32Array)),
  f32: definePropType("f32", addTypedArrayStore(Float32Array)),
  f64: definePropType("f64", addTypedArrayStore(Float64Array)),
  vec2: definePropType("vec2", addTypedArrayArrayStore(Float32Array, 2)),
  vec3: definePropType("vec3", addTypedArrayArrayStore(Float32Array, 3)),
  vec4: definePropType("vec4", addTypedArrayArrayStore(Float32Array, 4)),
  euler: definePropType("euler", addTypedArrayArrayStore(Float32Array, 3)),
  quat: definePropType("quat", addTypedArrayArrayStore(Float32Array, 4)),
  mat2: definePropType("mat2", addTypedArrayArrayStore(Float32Array, 4)),
  mat3: definePropType("mat3", addTypedArrayArrayStore(Float32Array, 9)),
  mat4: definePropType("mat4", addTypedArrayArrayStore(Float32Array, 16)),
  eid: definePropType("eid", addTypedArrayStore(Uint32Array)),
  string: definePropType("string", addMapStore<string>()),
  ref: <T>() => definePropType("ref", addMapStore<T>()),
};

interface ComponentDefinition {
  name: string;
  store:
    | {
        [key: string]: PropTypeDefinition<any>;
      }
    | PropTypeDefinition<any>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Component<Def extends ComponentDefinition> {
  componentName: string;
  add(eid: number): void;
  remove(eid: number): void;
}

export function defineComponent<Def extends ComponentDefinition>(definition: Def): Component<Def> {
  if ($propType in definition.store) {
    return {
      componentName: definition.name,
      add(eid: number) {},
      remove(eid: number) {},
    };
  }

  return {
    componentName: definition.name,
    add(eid: number) {},
    remove(eid: number) {},
  };
}
