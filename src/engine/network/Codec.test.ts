import { assert } from "vitest";

import { createCursorView, moveCursorView, readFloat32, readUint8 } from "../allocator/CursorView";
import { Binary, createAutoDecoder, createAutoEncoder, createMutationDecoder, createMutationEncoder } from "./Codec";

describe("Codec Tests", () => {
  describe("Auto Encoder/Decoder", () => {
    test("should encode", () => {
      const view = createCursorView(new ArrayBuffer(1));

      const schema = { data: Binary.ui8 };

      const encode = createAutoEncoder(schema);
      encode(view, { data: 1 });

      moveCursorView(view, 0);
      assert.strictEqual(readUint8(view), 1);
    });
    test("should decode", () => {
      const view = createCursorView(new ArrayBuffer(1));

      const schema = { data: Binary.ui8 };

      const encode = createAutoEncoder(schema);
      const decode = createAutoDecoder(schema);

      encode(view, { data: 1 });

      moveCursorView(view, 0);
      const obj = decode(view, { data: 0 });

      assert.isDefined(obj);
      assert.strictEqual(obj.data, 1);
    });
    test("should work with arrays", () => {
      const view = createCursorView(new ArrayBuffer(3));

      const schema = { [0]: Binary.ui8, [1]: Binary.ui8, [2]: Binary.ui8 };

      const encode = createAutoEncoder(schema);
      const decode = createAutoDecoder(schema);

      encode(view, [1, 1, 1]);

      moveCursorView(view, 0);
      const obj = decode(view, [0, 0, 0])!;

      assert.isDefined(obj);
      assert.strictEqual(obj[0], 1);
    });
  });

  describe("Mutation Encoder/Decoder", () => {
    test("should encode mutations only", () => {
      const view = createCursorView(new ArrayBuffer(7));

      const schema = { a: Binary.ui8, b: Binary.f32 };

      const encode = createMutationEncoder(schema);
      const obj = { a: 1, b: 2.5 };
      encode(view, obj);

      moveCursorView(view, 0);
      assert.strictEqual(readUint8(view), 0b11);
      assert.strictEqual(readUint8(view), 1);
      assert.strictEqual(readFloat32(view), 2.5);

      moveCursorView(view, 0);
      encode(view, obj);

      moveCursorView(view, 0);
      assert.strictEqual(readUint8(view), 0b0);

      obj.a = 2;

      moveCursorView(view, 0);
      encode(view, obj);

      moveCursorView(view, 0);
      assert.strictEqual(readUint8(view), 0b1);
      assert.strictEqual(readUint8(view), 2);

      obj.b = 3.5;

      moveCursorView(view, 0);
      encode(view, obj);

      moveCursorView(view, 0);
      assert.strictEqual(readUint8(view), 0b10);
      assert.strictEqual(readFloat32(view), 3.5);

      obj.a = 0;
      obj.b = 0;

      moveCursorView(view, 0);
      encode(view, obj);

      moveCursorView(view, 0);
      assert.strictEqual(readUint8(view), 0b11);
      assert.strictEqual(readUint8(view), 0);
      assert.strictEqual(readFloat32(view), 0);
    });
    test("should decode mutations only", () => {
      const view = createCursorView(new ArrayBuffer(7));

      const schema = { a: Binary.ui8, b: Binary.f32 };

      const encode = createMutationEncoder(schema);
      const decode = createMutationDecoder(schema);

      const objSource = { a: 1, b: 2.5 };
      const objSink = { a: 0, b: 0 };

      encode(view, objSource);

      moveCursorView(view, 0);
      decode(view, objSink);

      assert.strictEqual(objSink.a, 1);
      assert.strictEqual(objSink.b, 2.5);

      moveCursorView(view, 0);
      encode(view, objSource);

      objSink.a = 0;

      moveCursorView(view, 0);
      decode(view, objSink);

      assert.strictEqual(objSink.a, 0);
      assert.strictEqual(objSink.b, 2.5);

      objSource.a = 2;

      moveCursorView(view, 0);
      encode(view, objSource);
      assert.strictEqual(objSource.a, 2);
      assert.strictEqual(objSink.b, 2.5);

      objSource.b = 3.5;

      moveCursorView(view, 0);
      encode(view, objSource);
      assert.strictEqual(objSource.a, 2);
      assert.strictEqual(objSource.b, 3.5);

      objSource.a = 0;
      objSource.b = 0;

      moveCursorView(view, 0);
      encode(view, objSource);
      assert.strictEqual(objSource.a, 0);
      assert.strictEqual(objSource.b, 0);
    });
    test("should work with array mutations", () => {
      const view = createCursorView(new ArrayBuffer(4));

      // const schema = { [0]: Binary.ui8, [1]: Binary.ui8, [2]: Binary.ui8 };
      const schema = [Binary.ui8, Binary.ui8, Binary.ui8];

      const encode = createMutationEncoder(schema);
      const decode = createMutationDecoder(schema);

      const arrSource = [0, 1, 0];
      const arrSink = [0, 0, 0];

      encode(view, arrSource);

      moveCursorView(view, 0);
      decode(view, arrSink);

      assert.deepEqual(arrSink, [0, 1, 0]);

      arrSource[0] = 2;
      arrSource[2] = 3;

      moveCursorView(view, 0);
      encode(view, arrSource);

      moveCursorView(view, 0);
      decode(view, arrSink);

      assert.deepEqual(arrSink, [2, 1, 3]);
    });
  });
});
