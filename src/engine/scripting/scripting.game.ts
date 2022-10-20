import { addComponent, defineQuery } from "bitecs";

import scriptingRuntimeWASMUrl from "../../scripting/build/scripting-runtime.wasm?url";
import { addChild, Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { createSimpleCube } from "../mesh/mesh.game";
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
  malloc(size: number): number;
  initialize(): void;
  update(dt: number): void;
}

interface JSScriptExports extends ScriptExports {
  evalJS(ptr: number): void;
}

interface ScriptingModuleState {
  scripts: Script<ScriptExecutionEnvironment>[];
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

interface IScriptNodeComponent {
  id: Uint32Array;
  namePtr: Uint32Array;
  position: Float32Array;
  quaternion: Float32Array;
  scale: Float32Array;
  parent: Uint32Array;
  firstChild: Uint32Array;
  nextSibling: Uint32Array;
  prevSibiling: Uint32Array;
}

const ScriptNodeComponent = new Map<number, IScriptNodeComponent>();

const scriptTransformQuery = defineQuery([Transform, ScriptNodeComponent]);

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
    (script.instance.exports as ScriptExports).update(ctx.dt);
  }

  const scriptTransformEntities = scriptTransformQuery(ctx.world);

  for (let i = 0; i < scriptTransformEntities.length; i++) {
    const eid = scriptTransformEntities[i];
    const component = ScriptNodeComponent.get(eid);

    if (component) {
      Transform.position[eid].set(component.position);
      Transform.scale[eid].set(component.scale);
      Transform.quaternion[eid].set(component.quaternion);
    }
  }
}

export async function loadJSScript(ctx: GameState, source: string): Promise<Script<ScriptExecutionEnvironment.JS>> {
  const response = await fetch(scriptingRuntimeWASMUrl);
  const buffer = await response.arrayBuffer();
  const script = await loadScript(ctx, ScriptExecutionEnvironment.JS, buffer);
  const codePtr = allocateString(script.instance, script.HEAPU8, source);
  script.instance.exports.evalJS(codePtr);
  return script;
}

export async function loadWASMScript(ctx: GameState, url: string): Promise<Script<ScriptExecutionEnvironment.WASM>> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const script = await loadScript(ctx, ScriptExecutionEnvironment.WASM, buffer);
  return script;
}

async function loadScript<Env extends ScriptExecutionEnvironment>(
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
        const nodeEid = createSimpleCube(ctx, 1);
        addChild(ctx.activeScene, nodeEid);
        nodeIdToEid.set(nodeId, nodeEid);

        const nodePtr = instance!.exports.malloc(64);

        const component: IScriptNodeComponent = {
          id: new Uint32Array(memory.buffer, nodePtr, 1),
          namePtr: new Uint32Array(memory.buffer, nodePtr + 4, 1),
          position: new Float32Array(memory.buffer, nodePtr + 8, 3),
          quaternion: new Float32Array(memory.buffer, nodePtr + 20, 4),
          scale: new Float32Array(memory.buffer, nodePtr + 36, 3),
          parent: new Uint32Array(memory.buffer, nodePtr + 48, 1),
          firstChild: new Uint32Array(memory.buffer, nodePtr + 52, 1),
          nextSibling: new Uint32Array(memory.buffer, nodePtr + 56, 1),
          prevSibiling: new Uint32Array(memory.buffer, nodePtr + 60, 1),
        };

        ScriptNodeComponent.set(nodeEid, component);

        component.id[0] = nodeId;

        const nameStrPointer = allocateString(instance!, HEAPU8, "Test Node");
        component.namePtr[0] = nameStrPointer;

        component.position.set(Transform.position[nodeEid]);
        component.quaternion.set(Transform.quaternion[nodeEid]);
        component.scale.set(Transform.scale[nodeEid]);

        addComponent(world, ScriptNodeComponent, nodeEid);

        return nodePtr;
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

  if ("_initialize" in instance.exports) {
    (instance.exports._initialize as Function)();
  }

  instance.exports.initialize();

  const script: Script<Env> = {
    instance,
    module: result.module,
    environment,
    HEAPU32,
    HEAPU8,
    dispose: false,
    nextNodeId,
    nodeIdToEid,
  };

  const { scripts } = getModule(ctx, ScriptingModule);

  scripts.push(script);

  return script;
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
