import scriptingRuntimeWASMUrl from "../../scripting/build/scripting-runtime.wasm?url";
import { createTransformEntity } from "../component/transform";
import { GameState } from "../GameTypes";
import { defineModule, getModule } from "../module/module.common";

export enum ScriptExecutionEnvironment {
  JS,
  WASM,
}

type ScriptWebAssemblyInstance<Env extends ScriptExecutionEnvironment> = WebAssembly.Instance &
  (Env extends ScriptExecutionEnvironment.WASM ? { exports: ScriptExports } : { exports: JSScriptExports });

interface Script<Env extends ScriptExecutionEnvironment = ScriptExecutionEnvironment.WASM> {
  environment: Env;
  module: WebAssembly.Module;
  instance: ScriptWebAssemblyInstance<Env>;
  HEAPU8: Uint8Array;
  HEAPU32: Uint32Array;
  dispose: boolean;
  nextNodeId: number;
  nodeIdToEid: Map<number, number>;
}

interface ScriptExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  _initialize(): void;
  initialize(): void;
  update(): void;
}

interface JSScriptExports extends ScriptExports {
  evalJS(ptr: number): void;
}

interface ScriptingModuleState {
  scripts: Script[];
}

export const ScriptingModule = defineModule<GameState, ScriptingModuleState>({
  name: "scripting",
  async create() {
    return {
      scripts: [],
    };
  },
  init(ctx) {},
});

export function ScriptingSystem(ctx: GameState) {
  const { scripts } = getModule(ctx, ScriptingModule);

  for (let i = scripts.length - 1; i >= 0; i--) {
    const script = scripts[i];

    if (script.dispose) {
      scripts.splice(i, 1);
    }
  }

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    (script.instance.exports as ScriptExports).update();
  }
}

export async function loadJSScript(ctx: GameState, source: string): Promise<Script<ScriptExecutionEnvironment.JS>> {
  const response = await fetch(scriptingRuntimeWASMUrl);
  const buffer = await response.arrayBuffer();
  const script = await loadWASMScript(ctx, ScriptExecutionEnvironment.JS, buffer);
  const codePtr = allocateString(script.instance, script.HEAPU8, source);
  script.instance.exports.evalJS(codePtr);
  return script;
}

export async function loadWASMScript<Env extends ScriptExecutionEnvironment>(
  ctx: GameState,
  environment: Env,
  buffer: ArrayBuffer
): Promise<Script<Env>> {
  const { world } = ctx;

  let instance: ScriptWebAssemblyInstance<Env> | undefined = undefined;

  let nextNodeId = 0;
  const nodeIdToEid = new Map();

  const memory = new WebAssembly.Memory({
    initial: 256,
    maximum: 256,
    shared: true,
  });

  const HEAPU8 = new Uint8Array(memory.buffer);
  const HEAPU32 = new Uint32Array(memory.buffer);

  const result = await WebAssembly.instantiate(buffer, {
    env: {
      memory,
    },
    wasgi: {
      /**
       * See scripting-runtime.c for Node struct layout
       * @returns pointer to node struct
       */
      create_node: () => {
        const nodeId = nextNodeId++;
        const eid = createTransformEntity(world);
        nodeIdToEid.set(nodeId, eid);

        const ptr = instance!.exports.malloc(64);

        HEAPU32[ptr / 4] = 1337;

        return ptr;
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

  instance = result.instance as ScriptWebAssemblyInstance<Env>;

  instance.exports._initialize();
  instance.exports.initialize();

  return {
    instance,
    module: result.module,
    environment,
    HEAPU32,
    HEAPU8,
    dispose: false,
    nextNodeId,
    nodeIdToEid,
  };
}

export function disposeScript(script: Script) {
  script.dispose = true;
}

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
