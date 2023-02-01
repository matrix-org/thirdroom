import {
  copyToWriteBuffer,
  createTripleBuffer,
  getReadBufferIndex,
  getWriteBufferIndex,
  TripleBuffer,
} from "./TripleBuffer";
import { TypedArrayConstructor } from "../utils/typedarray";
import { roundUpToMultiple4, roundUpToMultiple8 } from "../utils/byte-alignment";

export type ObjectBufferViewSchema = {
  [key: string]: [TypedArrayConstructor, number] | [TypedArrayConstructor, number, number];
};

export function defineObjectBufferSchema<Schema extends ObjectBufferViewSchema>(schema: Schema) {
  return schema;
}

export type ObjectBufferView<Schema extends ObjectBufferViewSchema, Buffer extends ArrayBuffer | SharedArrayBuffer> = {
  [Prop in keyof Schema]: Schema[Prop][2] extends undefined
    ? InstanceType<Schema[Prop][0]>
    : InstanceType<Schema[Prop][0]>[];
} & { buffer: Buffer; byteView: Uint8Array };

export function createObjectBufferView<
  Schema extends ObjectBufferViewSchema,
  Buffer extends ArrayBufferConstructor | SharedArrayBufferConstructor
>(schema: Schema, bufferConstructor: Buffer): ObjectBufferView<Schema, InstanceType<Buffer>> {
  let byteLength = 0;

  for (const key in schema) {
    if (key === "buffer") {
      throw new Error('"buffer" is a reserved ObjectBufferView property name.');
    }
    const [typedArrayConstructor, length, elements] = schema[key];

    byteLength += typedArrayConstructor.BYTES_PER_ELEMENT * length * (elements || 1);

    byteLength = typedArrayConstructor.name.includes("32")
      ? roundUpToMultiple4(byteLength)
      : typedArrayConstructor.name.includes("64")
      ? roundUpToMultiple8(byteLength)
      : byteLength;
  }

  const buffer = new bufferConstructor(byteLength) as InstanceType<Buffer>;
  const byteView = new Uint8Array(buffer);

  // TODO: Type this
  const object: any = { buffer, byteView };

  let byteOffset = 0;

  for (const key in schema) {
    const [typedArrayConstructor, length, elements] = schema[key];

    byteOffset = typedArrayConstructor.name.includes("32")
      ? roundUpToMultiple4(byteOffset)
      : typedArrayConstructor.name.includes("64")
      ? roundUpToMultiple8(byteOffset)
      : byteOffset;

    if (elements === undefined) {
      const arr = new typedArrayConstructor(buffer, byteOffset, length);
      byteOffset += arr.byteLength;
      object[key] = arr;
    } else {
      object[key] = Array.from({ length }, () => {
        const arr = new typedArrayConstructor(buffer, byteOffset, elements);
        byteOffset += arr.byteLength;

        return arr;
      });
    }
  }

  return object;
}

export function clearObjectBufferView(object: ObjectBufferView<any, any>) {
  object.byteView.fill(0);
}

export interface ObjectTripleBuffer<Schema extends ObjectBufferViewSchema> {
  views: ObjectBufferView<Schema, SharedArrayBuffer>[];
  tripleBuffer: TripleBuffer;
  initialized: boolean;
}

export type ObjectTripleBufferView<O extends ObjectTripleBuffer<any>> = O["views"][number];

export type ReadObjectTripleBufferView<O extends ObjectTripleBuffer<any>> = Readonly<O["views"][number]>;

export function createObjectTripleBuffer<Schema extends ObjectBufferViewSchema>(
  schema: Schema,
  flags: Uint8Array
): ObjectTripleBuffer<Schema> {
  const views = Array.from({ length: 3 }, () => createObjectBufferView(schema, SharedArrayBuffer));
  const buffers = views.map((view) => view.buffer);
  const byteViews = views.map((view) => view.byteView);
  const tripleBuffer = createTripleBuffer(flags, buffers[0].byteLength, buffers, byteViews);

  return {
    views,
    tripleBuffer,
    initialized: false,
  };
}

export function getWriteObjectBufferView<Schema extends ObjectBufferViewSchema>(
  object: ObjectTripleBuffer<Schema>
): ObjectBufferView<Schema, SharedArrayBuffer> {
  const index = getWriteBufferIndex(object.tripleBuffer);
  return object.views[index];
}

export function getReadObjectBufferView<Schema extends ObjectBufferViewSchema>(
  object: ObjectTripleBuffer<Schema>
): {
  [P in keyof ObjectBufferView<Schema, SharedArrayBuffer>]: Readonly<ObjectBufferView<Schema, SharedArrayBuffer>[P]>;
} {
  const index = getReadBufferIndex(object.tripleBuffer);
  return object.views[index];
}

export function commitToObjectTripleBuffer<Schema extends ObjectBufferViewSchema>(
  objectTripleBuffer: ObjectTripleBuffer<Schema>,
  objectBufferView: ObjectBufferView<Schema, any>
): void {
  if (!objectTripleBuffer.initialized) {
    objectTripleBuffer.tripleBuffer.byteViews[0].set(objectBufferView.byteView);
    objectTripleBuffer.tripleBuffer.byteViews[1].set(objectBufferView.byteView);
    objectTripleBuffer.tripleBuffer.byteViews[2].set(objectBufferView.byteView);
    objectTripleBuffer.initialized = true;
  } else {
    copyToWriteBuffer(objectTripleBuffer.tripleBuffer, objectBufferView.byteView);
  }
}
