export type TypedArray = TypedArray32 | BigUint64Array | BigInt64Array;

export type TypedArray32 = Float32Array | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array;

export type TypedArrayConstructor =
  | TypedArrayConstructor32
  | Float64ArrayConstructor
  | BigUint64ArrayConstructor
  | BigInt64ArrayConstructor;

export type TypedArrayConstructor32 =
  | Float32ArrayConstructor
  | Uint8ArrayConstructor
  | Int8ArrayConstructor
  | Uint16ArrayConstructor
  | Int16ArrayConstructor
  | Uint32ArrayConstructor
  | Int32ArrayConstructor;
