import scriptingRuntimeWASMUrl from "../../scripting/build/scripting-runtime.wasm?url";
import { GameState } from "../GameTypes";
import { defineModule, getModule } from "../module/module.common";
import { ScriptResourceManager } from "../resource/ScriptResourceManager";

export enum ScriptExecutionEnvironment {
  JS,
  WASM,
}

export type ScriptWebAssemblyInstance<Env extends ScriptExecutionEnvironment> = WebAssembly.Instance &
  (Env extends ScriptExecutionEnvironment.WASM ? { exports: ScriptExports } : { exports: JSScriptExports });

interface Script<Env extends ScriptExecutionEnvironment = ScriptExecutionEnvironment.WASM> {
  environment: Env;
  module: WebAssembly.Module;
  instance: ScriptWebAssemblyInstance<Env>;
  resourceManager: ScriptResourceManager;
  dispose: boolean;
  U8Heap: Uint8Array;
}

interface ScriptExports extends WebAssembly.Exports {
  allocate(size: number): number;
  deallocate(ptr: number): void;
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
    script.instance.exports.update(ctx.dt);
  }
}

export async function loadJSScript(
  ctx: GameState,
  resourceManager: ScriptResourceManager,
  source: string
): Promise<Script<ScriptExecutionEnvironment.JS>> {
  const response = await fetch(scriptingRuntimeWASMUrl);
  const buffer = await response.arrayBuffer();
  const script = await loadScript(ctx, resourceManager, ScriptExecutionEnvironment.JS, buffer);
  const arr = new TextEncoder().encode(source);
  const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
  const codePtr = script.instance.exports.allocate(nullTerminatedArr.byteLength);
  nullTerminatedArr.set(arr);
  script.U8Heap.set(nullTerminatedArr, codePtr);
  script.instance.exports.evalJS(codePtr);
  return script;
}

export async function loadWASMScript(
  ctx: GameState,
  resourceManager: ScriptResourceManager,
  url: string
): Promise<Script<ScriptExecutionEnvironment.WASM>> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const script = await loadScript(ctx, resourceManager, ScriptExecutionEnvironment.WASM, buffer);
  return script;
}

async function loadScript<Env extends ScriptExecutionEnvironment>(
  ctx: GameState,
  resourceManager: ScriptResourceManager,
  environment: Env,
  buffer: ArrayBuffer
): Promise<Script<Env>> {
  let instance: ScriptWebAssemblyInstance<Env> | undefined = undefined;

  const result = await WebAssembly.instantiate(buffer, resourceManager.createImports());

  instance = result.instance as ScriptWebAssemblyInstance<Env>;

  resourceManager.setInstance(instance);

  if ("_initialize" in instance.exports) {
    (instance.exports._initialize as Function)();
  }

  instance.exports.initialize();

  const script: Script<Env> = {
    instance,
    module: result.module,
    environment,
    resourceManager,
    dispose: false,
    U8Heap: new Uint8Array(resourceManager.memory.buffer),
  };

  const { scripts } = getModule(ctx, ScriptingModule);

  scripts.push(script);

  return script;
}

export function disposeScript(script: Script) {
  script.dispose = true;
}
