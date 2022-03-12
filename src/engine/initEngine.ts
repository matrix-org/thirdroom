import { EventEmitter } from "events";
import { EquirectangularReflectionMapping } from "three";
import { ActionMappingSystem, Object3DComponent, RendererSystem, GroupEntity } from "threecs";
import { createThreeWorld, ThreeWorld } from "./createThreeWorld";
import defaultEnvMapUrl from "../../res/cubemap/venice_sunset_1k.hdr?url";

export enum EngineState {
  Uninitialized,
  Initialized,
  Loading,
  Loaded,
  Entering,
  Entered,
  Exiting,
  Exited,
}

type System = (world: ThreeWorld) => void;

export class Engine extends EventEmitter {
  public state: EngineState = EngineState.Uninitialized;
  public world?: ThreeWorld;
  public systems: System[] = [];

  onResize = () => {
    if (this.world) {
      this.world.resizeViewport = true;
    }
  };
}

function updateState(engine: Engine, nextState: EngineState) {
  engine.state = nextState;
  engine.emit("state-changed", engine.state);
  return engine;
}

export function createEngine() {
  return new Engine();
}

async function loadEnvironmentMap(
  engine: Engine,
  environmentMapUrl: string
) {
  const world = engine.world!;
  const environmentTexture = await world.rgbeLoader.loadAsync(
    environmentMapUrl
  );
  environmentTexture.mapping = EquirectangularReflectionMapping;
  world.scene.environment = environmentTexture;
  world.scene.background = environmentTexture;
}


export async function loadEngine(engine: Engine, canvas: HTMLCanvasElement) {
  window.addEventListener("resize", engine.onResize);
  engine.world = await createThreeWorld(canvas);
  engine.systems.push(
    ActionMappingSystem,
    RendererSystem,
    Object3DComponent.disposeSystem,
  );
  updateState(engine, EngineState.Initialized);
  return engine;
}

export async function loadWorld(engine: Engine, sceneUrl: string) {
  updateState(engine, EngineState.Loading);
  const world = engine.world!;
  await loadEnvironmentMap(engine, defaultEnvMapUrl);
  const { scene } = await world.gltfLoader.loadAsync(sceneUrl);
  world.scene.add(scene as unknown as GroupEntity);
  world.renderer.setAnimationLoop(() => update(engine));
  updateState(engine, EngineState.Loaded);
  return engine;
}

export function enterWorld(engine: Engine) {
  updateState(engine, EngineState.Entering);

  updateState(engine, EngineState.Entered);
  return engine;
}


export function exitWorld(engine: Engine) {
  updateState(engine, EngineState.Exiting);
  engine.world?.renderer.setAnimationLoop(null);
  updateState(engine, EngineState.Exited);
  return engine;
}

export function disposeEngine(engine: Engine) {
  window.removeEventListener("resize", engine.onResize);
  engine.world?.renderer.dispose();
}

export function update(engine: Engine) {
  const world = engine.world!;
  const now = performance.now();
  const last = world.time || 0;
  world.dt = now - last;
  world.time = now;
  world.elapsed += world.dt;
  for (let i = 0; i < engine.systems.length; i++) {
    const system = engine.systems[i];
    system(engine.world!);
  }
  world.input.set("Mouse/movementX", 0);
  world.input.set("Mouse/movementY", 0);
}
