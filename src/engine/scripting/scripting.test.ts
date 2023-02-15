import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFile } from "fs/promises";
import { resolve } from "path";

import { createWASIModule } from "./wasi";
import {
  readJSON,
  readString,
  readUint32Array,
  WASMModuleContext,
  writeArrayBuffer,
  writeEncodedString,
  writeUint8Array,
} from "./WASMModuleContext";
import { createMatrixWASMModule } from "../matrix/matrix.game";
import { GameState } from "../GameTypes";
import { createWebSGModule } from "./websg";
import { createWebSGNetworkModule } from "../network/scripting.game";
import { createThirdroomModule } from "./thirdroom";
import { mockGameState } from "../../../test/engine/mocks";
import { createCursorView } from "../allocator/CursorView";

interface TestContext {
  imports: any;
  wasmCtx: WASMModuleContext;
  evalJS: (source: string) => any;
}

function mockObject<T extends { [key: string]: any }>(obj: T, ignored: (keyof T)[] = []): T {
  for (const key in obj) {
    const prop = obj[key];

    if (typeof prop === "function" && !ignored.includes(key)) {
      obj[key] = vi.fn() as any;
    }
  }

  return obj;
}

describe("JS Scripting API", () => {
  beforeEach<TestContext>(async (context) => {
    const wasmPath = resolve(__dirname, "./emscripten/build/test.wasm");
    const wasmBuffer = await readFile(wasmPath);
    const memory = new WebAssembly.Memory({ initial: 1024, maximum: 1024 });

    const ctx: GameState = mockGameState();

    const wasmCtx: WASMModuleContext = {
      memory,
      cursorView: createCursorView(memory.buffer, true),
      U32Heap: new Uint32Array(memory.buffer),
      U8Heap: new Uint8Array(memory.buffer),
      F32Heap: new Float32Array(memory.buffer),
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
      resourceManager: ctx.resourceManager,
    };

    const source = /*js*/ `undefined;`;
    wasmCtx.encodedJSSource = wasmCtx.textEncoder.encode(source);

    const imports: WebAssembly.Imports = {
      env: {
        memory,
      },
      wasi_snapshot_preview1: createWASIModule(wasmCtx),
      matrix: mockObject(createMatrixWASMModule(ctx, wasmCtx)),
      websg: mockObject(createWebSGModule(ctx, wasmCtx)),
      websg_network: mockObject(createWebSGNetworkModule(ctx, wasmCtx)),
      thirdroom: mockObject(createThirdroomModule(ctx, wasmCtx), ["get_js_source", "get_js_source_size"]),
    };
    const { instance } = await WebAssembly.instantiate(wasmBuffer, imports);

    const wasmExports = instance.exports as any;

    wasmExports._initialize();

    if (wasmExports.websg_initialize() === -1) {
      throw new Error("Error initializing WASM context.");
    }

    context.imports = imports;
    context.wasmCtx = wasmCtx;
    context.evalJS = (source: string): any => {
      const sourceArr = wasmCtx.textEncoder.encode(source);
      const sourcePtr = wasmExports.test_alloc(sourceArr.byteLength + 1);
      writeEncodedString(wasmCtx, sourcePtr, sourceArr);
      const resultPtr = wasmExports.test_eval_js(sourcePtr);

      if (!resultPtr) {
        return undefined;
      }

      const resultString = readString(wasmCtx, resultPtr, Infinity);

      const result = JSON.parse(resultString);

      if (typeof result === "object" && "error" in result) {
        throw new Error(`${result.error} \n  Script stack:\n ${result.stack}`);
      }

      return result;
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("thirdroom", () => {
    describe(".enableMatrixMaterial()", () => {
      it<TestContext>("should be called with a boolean", ({ evalJS, imports }) => {
        const result1 = evalJS(/*js*/ `ThirdRoom.enableMatrixMaterial(true);`);
        expect(imports.thirdroom.enable_matrix_material).toHaveBeenCalledWith(1);
        expect(result1).toEqual(undefined);

        const result2 = evalJS(/*js*/ `ThirdRoom.enableMatrixMaterial(false);`);
        expect(imports.thirdroom.enable_matrix_material).toHaveBeenCalledWith(0);
        expect(result2).toEqual(undefined);
      });
    });

    describe(".getAudioDataSize()", () => {
      it<TestContext>("should return the audio data size", ({ evalJS, imports }) => {
        imports.thirdroom.get_audio_data_size.mockImplementationOnce(() => 123);
        const result = evalJS(/*js*/ `ThirdRoom.getAudioDataSize();`);
        expect(imports.thirdroom.get_audio_data_size).toHaveBeenCalled();
        expect(result).toEqual(123);
      });
    });

    describe(".getAudioTimeData()", () => {
      it<TestContext>("should return the audio time data", ({ evalJS, imports, wasmCtx }) => {
        imports.thirdroom.get_audio_data_size.mockImplementation(() => 128);
        imports.thirdroom.get_audio_time_data.mockImplementationOnce((ptr: number) => {
          const arr = new Uint8Array(128);

          for (let i = 0; i < arr.length; i++) {
            arr[i] = i;
          }

          return writeUint8Array(wasmCtx, ptr, arr);
        });
        const result = evalJS(/*js*/ `
          const arr = new Uint8Array(ThirdRoom.getAudioDataSize());
          const bytesWritten = ThirdRoom.getAudioTimeData(arr);
          [bytesWritten, arr[127]];
        `);
        expect(imports.thirdroom.get_audio_data_size).toBeCalledTimes(2);
        expect(imports.thirdroom.get_audio_time_data).toBeCalled();
        expect(result).toEqual([128, 127]);
      });
    });

    describe(".getAudioFrequencyData()", () => {
      it<TestContext>("should return the audio frequency data", ({ evalJS, imports, wasmCtx }) => {
        imports.thirdroom.get_audio_data_size.mockImplementation(() => 100);
        imports.thirdroom.get_audio_frequency_data.mockImplementationOnce((ptr: number) => {
          const arr = new Uint8Array(100);

          for (let i = 0; i < arr.length; i++) {
            arr[i] = i;
          }

          return writeUint8Array(wasmCtx, ptr, arr);
        });
        const result = evalJS(/*js*/ `
          const arr = new Uint8Array(ThirdRoom.getAudioDataSize());
          const bytesWritten = ThirdRoom.getAudioFrequencyData(arr);
          [bytesWritten, arr[10]];
        `);
        expect(imports.thirdroom.get_audio_data_size).toBeCalledTimes(2);
        expect(imports.thirdroom.get_audio_frequency_data).toBeCalled();
        expect(result).toEqual([100, 10]);
      });
    });
  });

  describe("matrix", () => {
    describe(".listen()", () => {
      it<TestContext>("should return undefined when successful", ({ evalJS, imports }) => {
        imports.matrix.listen.mockImplementation(() => 0);
        const result = evalJS(/*js*/ `Matrix.listen();`);
        expect(imports.matrix.listen).toBeCalled();
        expect(result).toEqual(undefined);
      });

      it<TestContext>("should throw an error when unsuccessful", ({ evalJS, imports }) => {
        imports.matrix.listen.mockImplementation(() => -1);
        expect(() => evalJS(/*js*/ `Matrix.listen();`)).toThrowError("error listening for messages");
        expect(imports.matrix.listen).toBeCalled();
      });
    });

    describe(".close()", () => {
      it<TestContext>("should return undefined when successful", ({ evalJS, imports }) => {
        imports.matrix.close.mockImplementation(() => 0);
        const result = evalJS(/*js*/ `Matrix.close();`);
        expect(imports.matrix.close).toBeCalled();
        expect(result).toEqual(undefined);
      });

      it<TestContext>("should throw an error when unsuccessful", ({ evalJS, imports }) => {
        imports.matrix.close.mockImplementation(() => -1);
        expect(() => evalJS(/*js*/ `Matrix.close();`)).toThrowError("error closing listener");
        expect(imports.matrix.close).toBeCalled();
      });
    });

    describe(".send()", () => {
      it<TestContext>("should return undefined when implementation is successful", ({ evalJS, imports, wasmCtx }) => {
        imports.matrix.send.mockImplementationOnce(() => 0);

        const result = evalJS(/*js*/ `Matrix.send({ test: "Hello World!" });`);
        expect(result).toEqual(undefined);

        expect(imports.matrix.send).toBeCalled();
        const [eventPtr, byteLength] = imports.matrix.send.calls[0];
        const json = readJSON(wasmCtx, eventPtr, byteLength);
        expect(json).toEqual({ test: "Hello World!" });
      });

      it<TestContext>("should throw an error when send implementation is unsuccessful", ({ evalJS, imports }) => {
        imports.matrix.send.mockImplementation(() => -1);
        expect(() => evalJS(/*js*/ `Matrix.send({ test: "this should fail" });`)).toThrowError("error sending event");
        expect(imports.matrix.send).toBeCalled();
      });

      it<TestContext>("should throw an error when the message cannot be converted to JSON", ({ evalJS, imports }) => {
        imports.matrix.send.mockImplementation(() => 0);
        expect(() =>
          evalJS(/*js*/ `
          const obj = {};
          obj.circular = obj;
          Matrix.send(obj);
        `)
        ).toThrowError("circular reference");
      });
    });

    describe(".receive()", () => {
      it<TestContext>("should receive multiple messages and then stop", ({ evalJS, imports, wasmCtx }) => {
        imports.matrix.listen.mockImplementationOnce(() => 0);

        const encodedEvents = [
          wasmCtx.textEncoder.encode(JSON.stringify({ test1: 123 })),
          wasmCtx.textEncoder.encode(JSON.stringify({ test2: 456 })),
        ];

        imports.matrix.get_event_size
          .mockImplementationOnce(() => encodedEvents[0].byteLength)
          .mockImplementationOnce(() => encodedEvents[1].byteLength)
          .mockImplementationOnce(() => 0);
        imports.matrix.receive
          .mockImplementationOnce((eventPtr: number) => writeEncodedString(wasmCtx, eventPtr, encodedEvents[0]))
          .mockImplementationOnce((eventPtr: number) => writeEncodedString(wasmCtx, eventPtr, encodedEvents[1]))
          .mockImplementationOnce(() => 0);

        const result = evalJS(/*js*/ `
          Matrix.listen();

          const events = [];

          while (true) {
            const event = Matrix.receive();

            if (event === undefined) {
              break;
            }

            events.push(event);
          }

          events;
        `);
        expect(result).toEqual([{ test1: 123 }, { test2: 456 }]);

        expect(imports.matrix.get_event_size).toBeCalledTimes(3);
        expect(imports.matrix.receive).toBeCalledTimes(2);
      });

      it<TestContext>("should throw an error when receive implementation is unsuccessful", ({ evalJS, imports }) => {
        imports.matrix.get_event_size.mockImplementationOnce(() => 8);
        imports.matrix.receive.mockImplementationOnce(() => -1);

        expect(() => evalJS(/*js*/ `Matrix.receive();`)).toThrowError("error receiving event");
        expect(imports.matrix.receive).toBeCalled();
      });

      it<TestContext>("should throw an error when message cannot be parsed as JSON", ({ evalJS, imports, wasmCtx }) => {
        imports.matrix.listen.mockImplementationOnce(() => 0);

        const encodedEvent = wasmCtx.textEncoder.encode("not json");

        imports.matrix.get_event_size.mockImplementationOnce(() => encodedEvent.byteLength);
        imports.matrix.receive.mockImplementationOnce((eventPtr: number) =>
          writeEncodedString(wasmCtx, eventPtr, encodedEvent)
        );

        expect(() =>
          evalJS(/*js*/ `
          Matrix.listen();

          const events = [];

          let event;

          while (event = Matrix.receive()) {
            events.push(event);
          }

          events;
        `)
        ).toThrowError("unexpected token");

        expect(imports.matrix.get_event_size).toBeCalledTimes(1);
        expect(imports.matrix.receive).toBeCalledTimes(1);
      });
    });
  });

  describe("websg_network", () => {
    describe(".listen()", () => {
      it<TestContext>("should return undefined when successful", ({ evalJS, imports }) => {
        imports.websg_network.listen.mockImplementation(() => 0);
        const result = evalJS(/*js*/ `WebSG.Network.listen();`);
        expect(imports.websg_network.listen).toBeCalled();
        expect(result).toEqual(undefined);
      });

      it<TestContext>("should throw an error when unsuccessful", ({ evalJS, imports }) => {
        imports.websg_network.listen.mockImplementation(() => -1);
        expect(() => evalJS(/*js*/ `WebSG.Network.listen();`)).toThrowError("error listening for packets");
        expect(imports.websg_network.listen).toBeCalled();
      });
    });

    describe(".close()", () => {
      it<TestContext>("should return undefined when successful", ({ evalJS, imports }) => {
        imports.websg_network.close.mockImplementation(() => 0);
        const result = evalJS(/*js*/ `WebSG.Network.close();`);
        expect(imports.websg_network.close).toBeCalled();
        expect(result).toEqual(undefined);
      });

      it<TestContext>("should throw an error when unsuccessful", ({ evalJS, imports }) => {
        imports.websg_network.close.mockImplementation(() => -1);
        expect(() => evalJS(/*js*/ `WebSG.Network.close();`)).toThrowError("error closing listener");
        expect(imports.websg_network.close).toBeCalled();
      });
    });

    describe(".broadcast()", () => {
      it<TestContext>("should broadcast ArrayBuffer packets", ({ evalJS, imports, wasmCtx }) => {
        imports.websg_network.broadcast.mockImplementationOnce(() => 0);

        const result = evalJS(/*js*/ `
          const buffer = new ArrayBuffer(8);
          new Uint32Array(buffer).set([1, 7]);
          const result = WebSG.Network.broadcast(buffer);
          result;
        `);
        expect(result).toEqual(undefined);
        expect(imports.websg_network.broadcast).toBeCalled();
        const [packetPtr, byteLength] = imports.websg_network.broadcast.calls[0];
        const packet = readUint32Array(wasmCtx, packetPtr, byteLength);
        expect(packet[0]).toEqual(1);
        expect(packet[1]).toEqual(7);
      });

      it<TestContext>("should throw an error when broadcast implementation is unsuccessful", ({ evalJS, imports }) => {
        imports.websg_network.broadcast.mockImplementation(() => -1);
        expect(() => evalJS(/*js*/ `WebSG.Network.broadcast(new ArrayBuffer(1));`)).toThrowError(
          "error broadcasting event"
        );
        expect(imports.websg_network.broadcast).toBeCalled();
      });

      it<TestContext>("should throw an error when the message is not an array buffer", ({ evalJS, imports }) => {
        imports.websg_network.broadcast.mockImplementation(() => 0);
        expect(() => evalJS(/*js*/ `WebSG.Network.broadcast("error");`)).toThrowError("ArrayBuffer object expected");
      });
    });

    describe(".receive()", () => {
      it<TestContext>("should receive multiple packets and then stop", ({ evalJS, imports, wasmCtx }) => {
        imports.websg_network.listen.mockImplementationOnce(() => 0);

        const packets = [new Uint32Array([15]).buffer, new Uint32Array([72, 36]).buffer];

        imports.websg_network.get_packet_size
          .mockImplementationOnce(() => packets[0].byteLength)
          .mockImplementationOnce(() => packets[1].byteLength)
          .mockImplementationOnce(() => 0);
        imports.websg_network.receive
          .mockImplementationOnce((eventPtr: number) => writeArrayBuffer(wasmCtx, eventPtr, packets[0]))
          .mockImplementationOnce((eventPtr: number) => writeArrayBuffer(wasmCtx, eventPtr, packets[1]))
          .mockImplementationOnce(() => 0);

        const result = evalJS(/*js*/ `
          WebSG.Network.listen();

          const values = [];

          let packet;

          while (packet = WebSG.Network.receive()) {
            values.push(Array.from(new Uint32Array(packet)));
          }

          values;
        `);
        expect(result).toEqual([[15], [72, 36]]);

        expect(imports.websg_network.get_packet_size).toBeCalledTimes(3);
        expect(imports.websg_network.receive).toBeCalledTimes(2);
      });

      it<TestContext>("should throw an error when receive implementation is unsuccessful", ({ evalJS, imports }) => {
        imports.websg_network.get_packet_size.mockImplementationOnce(() => 8);
        imports.websg_network.receive.mockImplementationOnce(() => -1);

        expect(() => evalJS(/*js*/ `WebSG.Network.receive();`)).toThrowError("error receiving packet");
        expect(imports.websg_network.receive).toBeCalled();
      });
    });

    describe(".receiveInto()", () => {
      it<TestContext>("should write packets to target array buffer", ({ evalJS, imports, wasmCtx }) => {
        imports.websg_network.listen.mockImplementationOnce(() => 0);

        const packets = [new Uint32Array([15]).buffer, new Uint32Array([72, 36]).buffer];

        imports.websg_network.get_packet_size
          .mockImplementationOnce(() => packets[0].byteLength)
          .mockImplementationOnce(() => packets[1].byteLength)
          .mockImplementationOnce(() => 0);
        imports.websg_network.receive
          .mockImplementationOnce((eventPtr: number) => writeArrayBuffer(wasmCtx, eventPtr, packets[0]))
          .mockImplementationOnce((eventPtr: number) => writeArrayBuffer(wasmCtx, eventPtr, packets[1]))
          .mockImplementationOnce(() => 0);

        const result = evalJS(/*js*/ `
          WebSG.Network.listen();
    
          const values = [];
    
          const target = new ArrayBuffer(8);
          let bytesRead = 0;
    
          while (bytesRead = WebSG.Network.receiveInto(target)) {
            values.push(Array.from(new Uint32Array(target)));
          }
    
          values;
        `);
        expect(result).toEqual([
          [15, 0],
          [72, 36],
        ]);

        expect(imports.websg_network.get_packet_size).toBeCalledTimes(3);
        expect(imports.websg_network.receive).toBeCalledTimes(2);
      });

      it<TestContext>("should throw an error when receive implementation is unsuccessful", ({ evalJS, imports }) => {
        imports.websg_network.get_packet_size.mockImplementationOnce(() => 8);
        imports.websg_network.receive.mockImplementationOnce(() => -1);

        expect(() => evalJS(/*js*/ `WebSG.Network.receiveInto(new ArrayBuffer(8));`)).toThrowError(
          "error receiving packet"
        );
        expect(imports.websg_network.receive).toBeCalled();
      });

      it<TestContext>("should throw an error when target array buffer is too small", ({ evalJS, imports }) => {
        imports.websg_network.get_packet_size.mockImplementationOnce(() => 8);
        imports.websg_network.receive.mockImplementationOnce(() => 0);

        expect(() => evalJS(/*js*/ `WebSG.Network.receiveInto(new ArrayBuffer(4));`)).toThrowError(
          "packet is too large for target array buffer"
        );
      });
    });
  });
});
