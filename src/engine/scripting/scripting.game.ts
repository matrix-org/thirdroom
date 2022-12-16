import { addComponent, defineQuery, exitQuery } from "bitecs";

import scriptingRuntimeWASMUrl from "../../scripting/build/scripting-runtime.wasm?url";
import { GameState } from "../GameTypes";
import { IRemoteResourceClass } from "../resource/RemoteResourceClass";
import { ResourceDefinition } from "../resource/ResourceDefinition";
import { ScriptResourceManager } from "../resource/ScriptResourceManager";

export enum ScriptExecutionEnvironment {
  JS,
  WASM,
}

export type ScriptWebAssemblyInstance<Env extends ScriptExecutionEnvironment = ScriptExecutionEnvironment> =
  WebAssembly.Instance &
    (Env extends ScriptExecutionEnvironment.WASM ? { exports: ScriptExports } : { exports: JSScriptExports });

export interface Script<Env extends ScriptExecutionEnvironment = ScriptExecutionEnvironment> {
  environment: Env;
  module: WebAssembly.Module;
  instance: ScriptWebAssemblyInstance<Env>;
  resourceManager: ScriptResourceManager;
  U8Heap: Uint8Array;
  source?: string;
  ready: boolean;
  loadedCalled: boolean;
}

interface ScriptExports extends WebAssembly.Exports {
  websg_allocate(size: number): number;
  websg_deallocate(ptr: number): void;
  websg_initialize(): void;
  websg_loaded(): void;
  websg_update(dt: number): void;
}

interface JSScriptExports extends ScriptExports {
  thirdroom_evalJS(ptr: number): void;
}

export const ScriptComponent = new Map<number, Script>();

export const scriptQuery = defineQuery([ScriptComponent]);
const scriptExitQuery = exitQuery(scriptQuery);

export function addScriptComponent(ctx: GameState, eid: number, script: Script) {
  addComponent(ctx.world, ScriptComponent, eid);
  ScriptComponent.set(eid, script);
}

export function ScriptingSystem(ctx: GameState) {
  const entities = scriptQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    const script = ScriptComponent.get(eid);

    if (script) {
      if (script.ready && !script.loadedCalled) {
        if (script.environment === ScriptExecutionEnvironment.JS) {
          const jsScript = script as Script<ScriptExecutionEnvironment.JS>;
          const arr = new TextEncoder().encode(script.source);
          const nullTerminatedArr = new Uint8Array(arr.byteLength + 1);
          const codePtr = jsScript.instance.exports.websg_allocate(nullTerminatedArr.byteLength);
          nullTerminatedArr.set(arr);
          jsScript.U8Heap.set(nullTerminatedArr, codePtr);
          jsScript.instance.exports.thirdroom_evalJS(codePtr);
        }

        if ("websg_loaded" in script.instance.exports) {
          script.instance.exports.websg_loaded();
        }

        script.loadedCalled = true;
      }

      if ("websg_update" in script.instance.exports) {
        script.instance.exports.websg_update(ctx.dt);
      }
    }
  }

  const removedEntities = scriptExitQuery(ctx.world);

  for (let i = 0; i < removedEntities.length; i++) {
    const eid = removedEntities[i];
    ScriptComponent.delete(eid);
  }
}

export async function loadJSScript(
  ctx: GameState,
  source: string,
  allowedResources: (ResourceDefinition | IRemoteResourceClass<ResourceDefinition>)[]
): Promise<Script<ScriptExecutionEnvironment.JS>> {
  const response = await fetch(scriptingRuntimeWASMUrl);
  const buffer = await response.arrayBuffer();
  const script = await loadScript(ctx, ScriptExecutionEnvironment.JS, buffer, allowedResources);
  script.source = source;
  return script;
}

export async function loadWASMScript(
  ctx: GameState,
  buffer: ArrayBuffer,
  allowedResources: (ResourceDefinition | IRemoteResourceClass<ResourceDefinition>)[]
): Promise<Script<ScriptExecutionEnvironment.WASM>> {
  const script = await loadScript(ctx, ScriptExecutionEnvironment.WASM, buffer, allowedResources);
  return script;
}

async function loadScript<Env extends ScriptExecutionEnvironment>(
  ctx: GameState,
  environment: Env,
  buffer: ArrayBuffer,
  allowedResources: (ResourceDefinition | IRemoteResourceClass<ResourceDefinition>)[]
): Promise<Script<Env>> {
  let instance: ScriptWebAssemblyInstance<Env> | undefined = undefined;

  const resourceManager = new ScriptResourceManager(ctx, allowedResources);

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
    ready: false,
    loadedCalled: false,
    U8Heap: new Uint8Array(resourceManager.memory.buffer),
  };

  if ("websg_initialize" in script.instance.exports) {
    instance.exports.websg_initialize();
  }

  return script;
}
