import { addComponent, defineQuery, exitQuery } from "bitecs";

import scriptingRuntimeWASMUrl from "./emscripten/build/scripting-runtime.wasm?url";
import { createCursorView } from "../allocator/CursorView";
import { GameState, RemoteResourceManager } from "../GameTypes";
import { createMatrixWASMModule } from "../matrix/matrix.game";
import { createWebSGNetworkModule } from "../network/scripting.game";
import { RemoteScene } from "../resource/RemoteResources";
import { createThirdroomModule } from "./thirdroom";
import { createWASIModule } from "./wasi";
import { WASMModuleContext } from "./WASMModuleContext";
import { createWebSGModule } from "./websg";

export enum ScriptState {
  Uninitialized,
  Initialized,
  Loaded,
  Entered,
}

export interface Script {
  wasmCtx: WASMModuleContext;
  state: ScriptState;
  initialize: () => void;
  loaded: () => void;
  entered: () => void;
  update: (dt: number) => void;
}

export const ScriptComponent = new Map<number, Script>();

export const scriptQuery = defineQuery([ScriptComponent]);
const scriptExitQuery = exitQuery(scriptQuery);

export function addScriptComponent(ctx: GameState, scene: RemoteScene, script: Script) {
  const eid = scene.eid;
  script.loaded();
  addComponent(ctx.world, ScriptComponent, eid);
  ScriptComponent.set(eid, script);
}

export function ScriptingSystem(ctx: GameState) {
  const entities = scriptQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const script = ScriptComponent.get(eid)!;
    script.update(ctx.dt);
  }

  const removedEntities = scriptExitQuery(ctx.world);

  for (let i = 0; i < removedEntities.length; i++) {
    const eid = removedEntities[i];
    ScriptComponent.delete(eid);
  }
}

export async function loadScript(
  ctx: GameState,
  resourceManager: RemoteResourceManager,
  scriptUrl: string
): Promise<Script> {
  const memory = new WebAssembly.Memory({ initial: 1024, maximum: 1024 });

  const wasmCtx: WASMModuleContext = {
    resourceManager,
    memory,
    U8Heap: new Uint8Array(memory.buffer),
    U32Heap: new Uint32Array(memory.buffer),
    F32Heap: new Float32Array(memory.buffer),
    cursorView: createCursorView(memory.buffer, true),
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  };

  let wasmBuffer: ArrayBuffer | undefined;

  const response = await fetch(scriptUrl);

  const contentType = response.headers.get("content-type");

  if (contentType) {
    if (
      contentType === "application/javascript" ||
      contentType === "application/x-javascript" ||
      contentType.startsWith("text/javascript")
    ) {
      const scriptSource = await response.text();
      const jsWASMResponse = await fetch(scriptingRuntimeWASMUrl);
      wasmBuffer = await jsWASMResponse.arrayBuffer();
      wasmCtx.encodedJSSource = wasmCtx.textEncoder.encode(scriptSource);
    } else if (contentType === "application/wasm") {
      wasmBuffer = await response.arrayBuffer();
    } else {
      throw new Error(`Invalid script content type "${contentType}" for script "${scriptUrl}"`);
    }
  } else {
    throw new Error(`Content type header not set for script "${scriptUrl}"`);
  }

  const imports: WebAssembly.Imports = {
    env: {
      memory,
    },
    wasi_snapshot_preview1: createWASIModule(wasmCtx),
    matrix: createMatrixWASMModule(ctx, wasmCtx),
    websg: createWebSGModule(ctx, wasmCtx),
    websg_network: createWebSGNetworkModule(ctx, wasmCtx),
    thirdroom: createThirdroomModule(ctx, wasmCtx),
  };

  const { instance } = await WebAssembly.instantiate(wasmBuffer, imports);

  const exports = instance.exports;

  const wasiInitialize =
    exports._initialize && typeof exports._initialize === "function" ? exports._initialize : undefined;

  const websgInitialize =
    exports.websg_initialize && typeof exports.websg_initialize === "function" ? exports.websg_initialize : undefined;

  const websgLoaded =
    exports.websg_loaded && typeof exports.websg_loaded === "function" ? exports.websg_loaded : undefined;

  const websgEntered =
    exports.websg_entered && typeof exports.websg_entered === "function" ? exports.websg_entered : undefined;

  const websgUpdate =
    exports.websg_update && typeof exports.websg_update === "function" ? exports.websg_update : undefined;

  const script: Script = {
    state: ScriptState.Uninitialized,
    wasmCtx,
    initialize() {
      if (this.state !== ScriptState.Uninitialized) {
        throw new Error("initialize() can only be called from the Uninitialized state");
      }

      if (wasiInitialize) {
        wasiInitialize();
      }

      if (websgInitialize) {
        websgInitialize();
      }

      this.state = ScriptState.Initialized;
    },
    loaded() {
      if (this.state !== ScriptState.Initialized) {
        throw new Error("initialize() can only be called from the Initialized state");
      }

      if (websgLoaded) {
        websgLoaded();
      }

      this.state = ScriptState.Loaded;
    },
    entered() {
      if (this.state !== ScriptState.Loaded) {
        throw new Error("initialize() can only be called from the Loaded state");
      }

      if (websgEntered) {
        websgEntered();
      }

      this.state = ScriptState.Entered;
    },
    update(dt: number) {
      if (this.state === ScriptState.Loaded || this.state === ScriptState.Entered) {
        if (websgUpdate) {
          websgUpdate(dt);
        }
      } else {
        throw new Error("update() can only be called from the Loaded or Entered state");
      }
    },
  };

  script.initialize();

  return script;
}
