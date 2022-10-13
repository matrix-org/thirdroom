import scriptingRuntimeWASMUrl from "../../../scripting/build/scripting-runtime.wasm?url";

const printCharBuffers: (number[] | null)[] = [null, [], []];

function printChar(stream: number, curr: number) {
  const buffer = printCharBuffers[stream];

  if (!buffer) {
    throw new Error("buffer doesn't exist");
  }

  if (curr === 0 || curr === 10) {
    if (stream === 1) {
      console.log(new TextDecoder("utf8").decode(new Uint8Array(buffer)));
    } else {
      console.error(new TextDecoder("utf8").decode(new Uint8Array(buffer)));
    }
    buffer.length = 0;
  } else {
    buffer.push(curr);
  }
}

function allocateString(instance: WebAssembly.Instance, heap: Uint8Array, str: string): number {
  const arr = new TextEncoder().encode(str);
  const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
  nullTerminatedArr.set(arr);
  const malloc = instance.exports.malloc as Function;
  const ptr = malloc(nullTerminatedArr.byteLength);
  heap.set(nullTerminatedArr, ptr);
  return ptr;
}

export class ScriptingRuntime {
  static async load(code: string): Promise<ScriptingRuntime> {
    const response = await fetch(scriptingRuntimeWASMUrl);
    const buffer = await response.arrayBuffer();

    let HEAPU8 = new Uint8Array();
    let HEAPU32 = new Uint32Array();

    let nodeId = 0;

    const { instance } = await WebAssembly.instantiate(buffer, {
      env: {
        create_node: () => {
          return nodeId++;
        },
      },
      wasi_snapshot_preview1: {
        environ_sizes_get: () => {
          return 0;
        },
        environ_get: () => {
          return 0;
        },
        clock_time_get: (a: number, b: number, ptime: number) => {
          const now = Date.now();
          // "now" is in ms, and wasi times are in ns.
          const nsec = Math.round(now * 1000 * 1000);
          HEAPU32[ptime >> 2] = nsec >>> 0;
          HEAPU32[(ptime + 4) >> 2] = (nsec / Math.pow(2, 32)) >>> 0;
          return 0;
        },
        fd_seek: () => {
          return 70;
        },
        fd_write: (fd: number, iov: number, iovcnt: number, pnum: number) => {
          // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
          let num = 0;
          for (let i = 0; i < iovcnt; i++) {
            const ptr = HEAPU32[iov >> 2];
            const len = HEAPU32[(iov + 4) >> 2];
            iov += 8;
            for (let j = 0; j < len; j++) {
              printChar(fd, HEAPU8[ptr + j]);
            }
            num += len;
          }
          HEAPU32[pnum >> 2] = num;
          return 0;
        },
        fd_close: () => {
          return 0;
        },
        proc_exit: (code: number) => {
          throw new Error(`exit(${code})`);
        },
      },
    });

    const memory = instance.exports.memory as WebAssembly.Memory;

    HEAPU8 = new Uint8Array(memory.buffer);
    HEAPU32 = new Uint32Array(memory.buffer);

    if (typeof instance.exports._initialize === "function") {
      instance.exports._initialize();
    }

    if (typeof instance.exports._start === "function") {
      instance.exports._start();
    }

    const initialize = instance.exports.initialize as Function;

    initialize();

    const codePtr = allocateString(instance, HEAPU8, code);

    const evalJS = instance.exports.evalJS as Function;

    evalJS(codePtr);

    return new ScriptingRuntime(instance);
  }

  constructor(private instance: WebAssembly.Instance) {}

  dispose() {}
}
