import {
  copyToWriteBuffer,
  createTripleBuffer,
  getReadBufferIndex,
  getWriteBufferIndex,
  TripleBuffer,
} from "./TripleBuffer";
import { TypedArrayConstructor } from "./types";

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
  }

  const buffer = new bufferConstructor(byteLength) as InstanceType<Buffer>;
  const byteView = new Uint8Array(buffer);

  // TODO: Type this
  const object: any = { buffer, byteView };

  let byteOffset = 0;

  for (const key in schema) {
    const [typedArrayConstructor, length, elements] = schema[key];

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

export interface ObjectTripleBufferView<Schema extends ObjectBufferViewSchema> {
  views: ObjectBufferView<Schema, SharedArrayBuffer>[];
  tripleBuffer: TripleBuffer;
}

export function createObjectTripleBufferView<Schema extends ObjectBufferViewSchema>(
  schema: Schema,
  flags: Uint8Array
): ObjectTripleBufferView<Schema> {
  const views = Array.from({ length: 3 }, () => createObjectBufferView(schema, SharedArrayBuffer));
  const buffers = views.map((view) => view.buffer);
  const byteViews = views.map((view) => view.byteView);
  const tripleBuffer = createTripleBuffer(flags, buffers[0].byteLength, buffers, byteViews);

  return {
    views,
    tripleBuffer,
  };
}

export function getWriteObjectBufferView<Schema extends ObjectBufferViewSchema>(
  object: ObjectTripleBufferView<Schema>
): ObjectBufferView<Schema, SharedArrayBuffer> {
  const index = getWriteBufferIndex(object.tripleBuffer);
  return object.views[index];
}

export function getReadObjectBufferView<Schema extends ObjectBufferViewSchema>(
  object: ObjectTripleBufferView<Schema>
): ObjectBufferView<Schema, SharedArrayBuffer> {
  const index = getReadBufferIndex(object.tripleBuffer);
  return object.views[index];
}

export type TripleBufferBackedObjectBufferView<
  Schema extends ObjectBufferViewSchema,
  Buffer extends ArrayBuffer | SharedArrayBuffer
> = ObjectTripleBufferView<Schema> & ObjectBufferView<Schema, Buffer>;

export function createTripleBufferBackedObjectBufferView<
  Schema extends ObjectBufferViewSchema,
  Buffer extends ArrayBuffer | SharedArrayBuffer
>(
  schema: Schema,
  objectBufferView: ObjectBufferView<Schema, Buffer>,
  flags: Uint8Array
): TripleBufferBackedObjectBufferView<Schema, Buffer> {
  return Object.assign(createObjectTripleBufferView(schema, flags), objectBufferView);
}

export function commitToTripleBufferView<
  Schema extends ObjectBufferViewSchema,
  Buffer extends ArrayBuffer | SharedArrayBuffer
>(object: TripleBufferBackedObjectBufferView<Schema, Buffer>): void {
  copyToWriteBuffer(object.tripleBuffer, object.buffer);
}
