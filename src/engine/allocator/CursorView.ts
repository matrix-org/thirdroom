import { TypedArray, TypedArrayConstructor32 } from "../utils/typedarray";

export type CursorView = DataView & {
  cursor: number;
  shadowMap: Map<TypedArray | string, TypedArray>;
  byteView: Uint8Array;
  littleEndian: boolean;
} & {
  [K: string]: Function;
};

export const createCursorView = (buffer = new ArrayBuffer(100000), littleEndian = false): CursorView => {
  const view = new DataView(buffer) as CursorView;
  view.cursor = 0;
  view.shadowMap = new Map();
  view.littleEndian = littleEndian;
  return view;
};

export const sliceCursorView = (v: CursorView) => {
  const packet = v.buffer.slice(0, v.cursor);
  v.cursor = 0;
  return packet;
};

export const scrollCursorView = (v: CursorView, amount: number) => {
  v.cursor += amount;
  return v;
};

export const moveCursorView = (v: CursorView, where: number) => {
  v.cursor = where;
  return v;
};

export const rewindCursorView = (v: CursorView) => {
  const where = v.cursor;
  return () => {
    v.cursor = where;
  };
};

/* Writers */

export const resize = (ta: TypedArray, byteLength: number) => {
  const newBuffer = new ArrayBuffer(byteLength);
  const newTa = new (ta as any).constructor(newBuffer);
  newTa.set(ta, 0);
  return newTa;
};

export const writeArrayBuffer = (v: CursorView, buffer: ArrayBuffer) => {
  new Uint8Array(v.buffer).set(new Uint8Array(buffer), v.cursor);
  v.cursor += buffer.byteLength;
  return v;
};

// dynamically obtains primitive type of passed in TypedArray object
// todo: memoize prop type
export const writeProp = (v: CursorView, prop: TypedArray | TypedArray[], entity: number, delta?: boolean) => {
  if (ArrayBuffer.isView(prop)) {
    v[`set${prop.constructor.name.replace("Array", "")}`](v.cursor, prop[entity]);
    v.cursor += prop.BYTES_PER_ELEMENT;
  } else {
    // todo
    // const arr = prop[entity];
    // // get length, infer index type
    // const indexBytes = arr.length < 2**8
    //   ? Uint8Array.BYTES_PER_ELEMENT
    //   : arr.length < 2**16
    //     ? Uint16Array.BYTES_PER_ELEMENT
    //     : Uint32Array.BYTES_PER_ELEMENT
  }
  return v;
};

export const writePropIfChanged = (v: CursorView, prop: TypedArray, entity: number, delta?: boolean) => {
  const { shadowMap } = v;

  // todo: decide if initialization counts as a change (probably shouldn't)
  // const shadowInit = !shadowMap.has(prop)

  const shadow = shadowMap.get(prop) || (shadowMap.set(prop, prop.slice().fill(0 as never)) && shadowMap.get(prop)!);

  const changed = shadow[entity] !== prop[entity]; // || shadowInit

  shadow[entity] = prop[entity];

  if (!changed) {
    return false;
  }

  writeProp(v, prop, entity);

  return true;
};

export const writeScalarPropIfChanged = (
  v: CursorView,
  propName: string,
  arrayType: TypedArrayConstructor32,
  prop: number
) => {
  const { shadowMap } = v;

  const shadow = shadowMap.get(propName) || (shadowMap.set(propName, new arrayType(1)) && shadowMap.get(propName)!);

  const changed = shadow[0] !== prop; // || shadowInit

  shadow[0] = prop;

  if (!changed) {
    return false;
  }

  writeProp(v, shadow, 0);

  return true;
};

export const writeFloat64 = (v: CursorView, value: number) => {
  v.setFloat64(v.cursor, value);
  v.cursor += Float64Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeFloat32 = (v: CursorView, value: number) => {
  v.setFloat32(v.cursor, value);
  v.cursor += Float32Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeUint64 = (v: CursorView, value: number) => {
  v.setUint64(v.cursor, value);
  v.cursor += BigUint64Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeInt64 = (v: CursorView, value: number) => {
  v.setInt64(v.cursor, value);
  v.cursor += BigInt64Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeUint32 = (v: CursorView, value: number) => {
  v.setUint32(v.cursor, value);
  v.cursor += Uint32Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeInt32 = (v: CursorView, value: number) => {
  v.setInt32(v.cursor, value);
  v.cursor += Int32Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeUint16 = (v: CursorView, value: number) => {
  v.setUint16(v.cursor, value);
  v.cursor += Uint16Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeInt16 = (v: CursorView, value: number) => {
  v.setInt16(v.cursor, value);
  v.cursor += Int16Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeUint8 = (v: CursorView, value: number) => {
  v.setUint8(v.cursor, value);
  v.cursor += Uint8Array.BYTES_PER_ELEMENT;
  return v;
};

export const writeInt8 = (v: CursorView, value: number) => {
  v.setInt8(v.cursor, value);
  v.cursor += Int8Array.BYTES_PER_ELEMENT;
  return v;
};

const textEncoder = new TextEncoder();
export function writeString(v: CursorView, str: string) {
  const encodedString = textEncoder.encode(str);
  writeUint8(v, encodedString.byteLength);
  writeArrayBuffer(v, encodedString);
  return v;
}

/* Spacers */

export const spaceFloat64 = (v: CursorView) => {
  const savePoint = v.cursor;
  v.cursor += Float64Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setFloat64(savePoint, value);
    return v;
  };
};

export const spaceFloat32 = (v: CursorView) => {
  const savePoint = v.cursor;
  v.cursor += Float32Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setFloat32(savePoint, value);
    return v;
  };
};

export const spaceUint64 = (v: CursorView) => {
  const savePoint = v.cursor;
  v.cursor += BigUint64Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setUint64(savePoint, value);
    return v;
  };
};

export const spaceInt64 = (v: CursorView) => {
  const savePoint = v.cursor;
  v.cursor += BigInt64Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setInt64(savePoint, value);
    return v;
  };
};

export const spaceUint32 = (v: CursorView) => {
  const savePoint = v.cursor;
  v.cursor += Uint32Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setUint32(savePoint, value);
    return v;
  };
};

export const spaceInt32 = (v: CursorView) => {
  const savePoint = v.cursor;
  v.cursor += Int32Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setInt32(savePoint, value);
    return v;
  };
};

export const spaceUint16 = (v: CursorView) => {
  const savePoint = v.cursor;
  v.cursor += Uint16Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setUint16(savePoint, value);
    return v;
  };
};

export const spaceInt16 = (v: CursorView) => {
  const savePoint = v.cursor;
  v.cursor += Int16Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setInt16(savePoint, value);
    return v;
  };
};

export const spaceUint8 = (v: CursorView) => {
  const savePoint = v.cursor;
  v.cursor += Uint8Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setUint8(savePoint, value);
    return v;
  };
};

export const spaceInt8 = (v: CursorView) => {
  const savePoint = v.cursor;
  v.cursor += Int8Array.BYTES_PER_ELEMENT;
  return (value: number) => {
    v.setInt8(savePoint, value);
    return v;
  };
};

/* Readers */

export const readArrayBuffer = (v: CursorView, byteLength: number) => {
  const ab = v.buffer.slice(v.cursor, v.cursor + byteLength);
  v.cursor += byteLength;
  return ab;
};

// dynamically obtains primitive type of passed in TypedArray object
// todo: memoize prop type
export const readProp = (v: CursorView, prop: TypedArray) => {
  const val = v[`get${prop.constructor.name.replace("Array", "")}`](v.cursor);
  v.cursor += prop.BYTES_PER_ELEMENT;
  return val;
};

export const readFloat64 = (v: CursorView) => {
  const val = v.getFloat64(v.cursor, v.littleEndian);
  v.cursor += Float64Array.BYTES_PER_ELEMENT;
  return val;
};

export const readFloat32 = (v: CursorView) => {
  const val = v.getFloat32(v.cursor, v.littleEndian);
  v.cursor += Float32Array.BYTES_PER_ELEMENT;
  return val;
};

export const readUint64 = (v: CursorView) => {
  const val = v.getBigUint64(v.cursor, v.littleEndian);
  v.cursor += BigUint64Array.BYTES_PER_ELEMENT;
  return val;
};

export const readInt64 = (v: CursorView) => {
  const val = v.getBigUint64(v.cursor, v.littleEndian);
  v.cursor += BigInt64Array.BYTES_PER_ELEMENT;
  return val;
};

export const readUint32 = (v: CursorView) => {
  const val = v.getUint32(v.cursor, v.littleEndian);
  v.cursor += Uint32Array.BYTES_PER_ELEMENT;
  return val;
};

export const readInt32 = (v: CursorView) => {
  const val = v.getInt32(v.cursor, v.littleEndian);
  v.cursor += Int32Array.BYTES_PER_ELEMENT;
  return val;
};

export const readUint16 = (v: CursorView) => {
  const val = v.getUint16(v.cursor, v.littleEndian);
  v.cursor += Uint16Array.BYTES_PER_ELEMENT;
  return val;
};

export const readInt16 = (v: CursorView) => {
  const val = v.getInt16(v.cursor, v.littleEndian);
  v.cursor += Int16Array.BYTES_PER_ELEMENT;
  return val;
};

export const readUint8 = (v: CursorView) => {
  const val = v.getUint8(v.cursor);
  v.cursor += Uint8Array.BYTES_PER_ELEMENT;
  return val;
};

export const readInt8 = (v: CursorView) => {
  const val = v.getInt8(v.cursor);
  v.cursor += Int8Array.BYTES_PER_ELEMENT;
  return val;
};

const textDecoder = new TextDecoder();
export function readString(v: CursorView) {
  const byteLength = readUint8(v);
  const encodedString = new Uint8Array(v.buffer, v.cursor, byteLength);
  v.cursor += byteLength;
  return textDecoder.decode(encodedString);
}

/* skip */

export const skipFloat32 = (v: CursorView) => {
  v.cursor += Float32Array.BYTES_PER_ELEMENT;
  return v;
};

export const skipUint8 = (v: CursorView) => {
  v.cursor += Uint8Array.BYTES_PER_ELEMENT;
  return v;
};

export const skipUint32 = (v: CursorView) => {
  v.cursor += Uint32Array.BYTES_PER_ELEMENT;
  return v;
};
