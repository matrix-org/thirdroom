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

export interface Script<Env extends ScriptExecutionEnvironment = ScriptExecutionEnvironment.WASM> {
  environment: Env;
  module: WebAssembly.Module;
  instance: ScriptWebAssemblyInstance<Env>;
  resourceManager: ScriptResourceManager;
  dispose: boolean;
  U8Heap: Uint8Array;
  source?: string;
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

export async function loadJSScript(ctx: GameState, source: string): Promise<Script<ScriptExecutionEnvironment.JS>> {
  const response = await fetch(scriptingRuntimeWASMUrl);
  const buffer = await response.arrayBuffer();
  const script = await loadScript(ctx, ScriptExecutionEnvironment.JS, buffer);
  script.source = source;
  return script;
}

export async function loadWASMScript(
  ctx: GameState,
  buffer: ArrayBuffer
): Promise<Script<ScriptExecutionEnvironment.WASM>> {
  const script = await loadScript(ctx, ScriptExecutionEnvironment.WASM, buffer);
  return script;
}

async function loadScript<Env extends ScriptExecutionEnvironment>(
  ctx: GameState,
  environment: Env,
  buffer: ArrayBuffer
): Promise<Script<Env>> {
  let instance: ScriptWebAssemblyInstance<Env> | undefined = undefined;

  const resourceManager = new ScriptResourceManager(ctx);

  const result = await WebAssembly.instantiate(buffer, resourceManager.createImports());

  instance = result.instance as ScriptWebAssemblyInstance<Env>;

  resourceManager.setInstance(instance);

  if ("_initialize" in instance.exports) {
    (instance.exports._initialize as Function)();
  }

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

export function runScript<Env extends ScriptExecutionEnvironment>(script: Script<Env>) {
  script.instance.exports.initialize();

  if (script.environment === ScriptExecutionEnvironment.JS) {
    const jsScript = script as Script<ScriptExecutionEnvironment.JS>;
    const arr = new TextEncoder().encode(script.source);
    const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
    const codePtr = jsScript.instance.exports.allocate(nullTerminatedArr.byteLength);
    nullTerminatedArr.set(arr);
    jsScript.U8Heap.set(nullTerminatedArr, codePtr);
    jsScript.instance.exports.evalJS(codePtr);
  }
}

export function disposeScript(script: Script) {
  script.dispose = true;
}
