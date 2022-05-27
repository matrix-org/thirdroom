import { TypedArrayConstructor } from "./types";

type ObjectBufferViewSchema = {
  [key: string]: [TypedArrayConstructor, number] | [TypedArrayConstructor, number, number];
};

type ObjectBufferView<Schema extends ObjectBufferViewSchema> = {
  [Prop in keyof Schema]: Schema[Prop][2] extends undefined
    ? InstanceType<Schema[Prop][0]>
    : InstanceType<Schema[Prop][0]>[];
};

export function createObjectBufferView<Schema extends ObjectBufferViewSchema>(
  schema: Schema,
  arrayBuffer: ArrayBufferConstructor | SharedArrayBufferConstructor
): ObjectBufferView<Schema> {
  // TODO implement this
}
