import { EventEmitter } from "events";
import { EquirectangularReflectionMapping } from "three";
import { ActionMappingSystem, InputDebugSystem, Object3DComponent, RendererSystem, GroupEntity, DirectionalMovementSystem, FirstPersonCameraSystem, initInput, InputResetSystem, ActiveCamera, removeComponent, PhysicsCharacterControllerSystem, loadPhysicsSystem, AnimationSystem } from "threecs";
import { createThreeWorld, ThreeWorld } from "./createThreeWorld";
import defaultEnvMapUrl from "../../res/cubemap/venice_sunset_1k.hdr?url";
import { addComponent } from "threecs";
import { loadGltf } from "./loadGltf";

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
  public disposeInput?: () => void;

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
  const PhysicsSystem = await loadPhysicsSystem();
  engine.world = await createThreeWorld(canvas);
  engine.systems.push(
    ActionMappingSystem,
    //InputDebugSystem,
    FirstPersonCameraSystem,
    PhysicsCharacterControllerSystem,
    AnimationSystem,
    PhysicsSystem,
    RendererSystem,
    Object3DComponent.disposeSystem,
    InputResetSystem,
  );
  engine.disposeInput = initInput(engine.world, { pointerLock: true });
  updateState(engine, EngineState.Initialized);
  return engine;
}

export async function loadWorld(engine: Engine, sceneUrl: string) {
  updateState(engine, EngineState.Loading);

  const world = engine.world!;
  await loadEnvironmentMap(engine, defaultEnvMapUrl);
  const scene = await loadGltf(world, sceneUrl);
  world.scene.add(scene);
  world.renderer.setAnimationLoop(() => update(engine));
  
  updateState(engine, EngineState.Loaded);
  return engine;
}

// TODO: Refactor into initialization system
export function enterWorld(engine: Engine) {
  updateState(engine, EngineState.Entering);

  const { playerRig, playerCamera, previewCamera, audioListener, scene } = engine.world!;
  scene.remove(previewCamera);
  playerRig.position.set(0, 0.01, 0);
  scene.add(playerRig);
  playerCamera.add(audioListener);
  removeComponent(engine.world!, ActiveCamera, previewCamera.eid);
  addComponent(engine.world!, ActiveCamera, playerCamera.eid);
  updateState(engine, EngineState.Entered);
  return engine;
}


export function exitWorld(engine: Engine) {
  updateState(engine, EngineState.Exiting);

  const { playerRig, playerCamera, previewCamera, audioListener, scene } = engine.world!;
  scene.remove(playerRig);
  scene.add(previewCamera);
  previewCamera.add(audioListener);
  removeComponent(engine.world!, ActiveCamera, playerCamera.eid);
  addComponent(engine.world!, ActiveCamera, previewCamera.eid);
  engine.world?.renderer.setAnimationLoop(null);
  updateState(engine, EngineState.Exited);

  return engine;
}

export function disposeEngine(engine: Engine) {
  window.removeEventListener("resize", engine.onResize);

  if (engine.disposeInput) {
    engine.disposeInput();
  }

  engine.world?.renderer.dispose();
}

export function update(engine: Engine) {
  const world = engine.world!;
  const now = performance.now();
  const last = world.time || 0;
  world.dt = (now - last) / 1000;
  world.time = now;
  world.elapsed += world.dt;
  for (let i = 0; i < engine.systems.length; i++) {
    const system = engine.systems[i];
    system(engine.world!);
  }
}
