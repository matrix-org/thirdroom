import {
  CursorView,
  readFloat32,
  readFloat64,
  readInt16,
  readInt32,
  readInt64,
  readInt8,
  readUint16,
  readUint32,
  readUint64,
  readUint8,
  spaceUint16,
  spaceUint32,
  spaceUint8,
  writeFloat32,
  writeFloat64,
  writeInt16,
  writeInt32,
  writeInt64,
  writeInt8,
  writeUint16,
  writeUint32,
  writeUint64,
  writeUint8,
} from "../allocator/CursorView";
import { checkBitflag } from "../utils/checkBitflag";

/**
 * Types
 */

export interface Codec<T> {
  encode: (view: CursorView, value: T) => number;
  decode: (view: CursorView, value: T) => void;
}

type ui8 = "ui8";
type i8 = "i8";
type ui16 = "ui16";
type i16 = "i16";
type ui32 = "ui32";
type i32 = "i32";
type f32 = "f32";
type f64 = "f64";
type i64 = "i64";
type ui64 = "ui64";

export type BinaryType = ui8 | i8 | ui16 | i16 | ui32 | i32 | f32 | f64 | i64 | ui64;

export const Binary = {
  ui8: "ui8" as ui8,
  i8: "i8" as i8,
  ui16: "ui16" as ui16,
  i16: "i16" as i16,
  ui32: "ui32" as ui32,
  i32: "i32" as i32,
  f32: "f32" as f32,
  f64: "f64" as f64,
  i64: "i64" as i64,
  ui64: "ui64" as ui64,
};

const BinaryToWriteFunction = {
  ui8: writeUint8,
  i8: writeInt8,
  ui16: writeUint16,
  i16: writeInt16,
  ui32: writeUint32,
  i32: writeInt32,
  ui64: writeUint64,
  i64: writeInt64,
  f32: writeFloat32,
  f64: writeFloat64,
};
const BinaryToReadFunction = {
  ui8: readUint8,
  i8: readInt8,
  ui16: readUint16,
  i16: readInt16,
  ui32: readUint32,
  i32: readInt32,
  ui64: readUint64,
  i64: readInt64,
  f32: readFloat32,
  f64: readFloat64,
};

export type CodecSchema =
  | BinaryType[]
  | {
      [key: string | number]: BinaryType;
    };

export type ObjectType<S extends CodecSchema> = {
  [key in keyof S]: S[key] extends ui64 ? bigint : S[key] extends i64 ? bigint : number;
};

type AutoEncoder<S extends CodecSchema> = (v: CursorView, object: ObjectType<S>) => CursorView | boolean;
type AutoDecoder<S extends CodecSchema> = (v: CursorView, object?: ObjectType<S>) => ObjectType<S>;

type MutationEncoder<S extends CodecSchema> = AutoEncoder<S>;
type MutationDecoder<S extends CodecSchema> = AutoDecoder<S>;

/**
 * API
 */

export const createAutoEncoder =
  <S extends CodecSchema>(schema: S): AutoEncoder<S> =>
  (v: CursorView, object: ObjectType<S>) => {
    for (const key in schema) {
      const type = schema[key];
      const value = object[key];
      const write = BinaryToWriteFunction[type];
      write(v, value as never);
    }
    return v;
  };

export const createAutoDecoder = <S extends CodecSchema>(schema: S): AutoDecoder<S> => {
  let o = {} as ObjectType<S>;
  return (v: CursorView, out?: ObjectType<S>): ObjectType<S> => {
    if (out) o = out;

    for (const key in schema) {
      const type = schema[key];
      const read = BinaryToReadFunction[type];
      o[key] = read(v) as never;
    }

    return o;
  };
};

export const createMutationEncoder = <S extends CodecSchema>(schema: S): MutationEncoder<S> => {
  const memoir = new Map<ObjectType<S>, ObjectType<S>>();

  const propCount = Object.keys(schema).length;
  if (propCount > 32) {
    throw new Error("Mutation encoding only supports schemas with <= 32 properties");
  }

  const changeMaskSpacer = propCount <= 8 ? spaceUint8 : propCount <= 16 ? spaceUint16 : spaceUint32;

  return (v: CursorView, object: ObjectType<S>) => {
    let memo = memoir.get(object);
    if (!memo) {
      memo = {} as ObjectType<S>;
      memoir.set(object, memo);
    }

    let mask = 0;
    let bit = 0;

    const writeChangeMask = changeMaskSpacer(v);

    for (const key in schema) {
      const type = schema[key];
      const lastValue = (memo as ObjectType<S>)[key];
      const value = object[key];

      if (lastValue !== value) {
        const write = BinaryToWriteFunction[type];
        write(v, value as never);
        mask |= 1 << bit++;
      } else {
        bit++;
      }

      (memo as ObjectType<S>)[key] = value;
    }

    writeChangeMask(mask);

    return mask > 0;
  };
};

export const createMutationDecoder = <S extends CodecSchema>(schema: S): MutationDecoder<S> => {
  let o = {} as ObjectType<S>;

  const propCount = Object.keys(schema).length;
  if (propCount > 32) {
    throw new Error("Mutation decoding only supports schemas with <= 32 properties");
  }

  const readChangeMask = propCount <= 8 ? readUint8 : propCount <= 16 ? readUint16 : readUint32;

  return (v: CursorView, out?: ObjectType<S>) => {
    if (out) o = out;

    const mask = readChangeMask(v);
    let b = 0;

    for (const key in schema) {
      if (!checkBitflag(mask, 1 << b++)) {
        continue;
      }
      const type = schema[key];
      const read = BinaryToReadFunction[type];
      o[key] = read(v) as never;
    }

    return o;
  };
};

export const createAutoCodec = (schema: CodecSchema) => ({
  encode: createAutoEncoder(schema),
  decode: createAutoDecoder(schema),
});

export const createMutationCodec = (schema: CodecSchema) => ({
  encode: createMutationEncoder(schema),
  decode: createMutationDecoder(schema),
});
