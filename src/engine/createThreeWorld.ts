import { addEntity, AudioListenerEntity, createWorld, defineComponent, defineQuery, enterQuery, Object3DComponent, Object3DEntity, IObject3DEntity, PerspectiveCameraEntity, SceneEntity, World, ActionMap, FirstPersonCameraActions, ActionType, BindingType, ActiveCamera, addComponent, PhysicsCharacterControllerActions, addPhysicsWorldComponent } from "threecs";
import {
  ACESFilmicToneMapping,
  AnimationMixer,
  Camera,
  LoadingManager,
  Object3D,
  PMREMGenerator,
  sRGBEncoding,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import Rapier from "@dimforge/rapier3d-compat";
import { createPlayerRig } from "./player-rig";

const actionMaps: ActionMap[] = [
  {
    id: "movement",
    actions: [
      {
        id: "look",
        path: FirstPersonCameraActions.Look,
        type: ActionType.Vector2,
        bindings: [
          {
            type: BindingType.Axes,
            x: "Mouse/movementX",
            y: "Mouse/movementY",
          },
        ],
      },
      {
        id: "move",
        path: PhysicsCharacterControllerActions.Move,
        type: ActionType.Vector2,
        bindings: [
          {
            type: BindingType.DirectionalButtons,
            up: "Keyboard/KeyW",
            down: "Keyboard/KeyS",
            left: "Keyboard/KeyA",
            right: "Keyboard/KeyD",
          },
        ],
      },
      {
        id: "jump",
        path: PhysicsCharacterControllerActions.Jump,
        type: ActionType.Button,
        bindings: [
          {
            type: BindingType.Button,
            path: "Keyboard/Space",
          },
        ],
      },
      {
        id: "crouch",
        path: PhysicsCharacterControllerActions.Crouch,
        type: ActionType.Button,
        bindings: [
          {
            type: BindingType.Button,
            path: "Keyboard/KeyC",
          },
        ],
      },
      {
        id: "sprint",
        path: PhysicsCharacterControllerActions.Sprint,
        type: ActionType.Button,
        bindings: [
          {
            type: BindingType.Button,
            path: "Keyboard/ShiftLeft",
          },
        ],
      },
    ],
  },
];

export interface ThreeWorld extends World {
  renderer: WebGLRenderer;
  canvas: HTMLCanvasElement;
  gltfLoader: GLTFLoader;
  rgbeLoader: RGBELoader;
  loadingManager: LoadingManager;
  pmremGenerator: PMREMGenerator;
  previewCamera: PerspectiveCameraEntity;
  playerCamera: PerspectiveCameraEntity;
  playerRig: Object3DEntity;
  activeCamera: IObject3DEntity<Camera>;
  activeScene: Object3DEntity;
  audioListener: AudioListenerEntity;
  animationMixer: AnimationMixer;
  gravity: Rapier.Vector3;
  physicsWorld: Rapier.World;
}

// TODO: Move threecs world construction to threecs createThreeWorld
export async function createThreeWorld(canvas: HTMLCanvasElement): Promise<ThreeWorld> {
  const world = createWorld<ThreeWorld>();
  world.dt = 0;
  world.time = 0;
  world.input = new Map();
  world.actionMaps = actionMaps;
  world.actions = new Map();
  world.resizeViewport = true;

  // noop entity 0
  const noop = addEntity(world);

  const loadingManager = new LoadingManager();
  const rgbeLoader = new RGBELoader(loadingManager);
  const gltfLoader = new GLTFLoader(loadingManager);
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = sRGBEncoding;
  renderer.toneMappingExposure = 1;
  renderer.toneMapping = ACESFilmicToneMapping;

  const pmremGenerator = new PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const scene = new SceneEntity(world);

  const previewCamera = new PerspectiveCameraEntity(
    world,
    70,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  previewCamera.name = "Preview Camera";
  addComponent(world, ActiveCamera, previewCamera.eid);
  scene.add(previewCamera);

  const audioListener = new AudioListenerEntity(world);
  previewCamera.add(audioListener);

  const defaultScene = new Object3DEntity(world);
  scene.add(defaultScene);

  const animationMixer = new AnimationMixer(scene as unknown as Object3D);

  const gravity = new Rapier.Vector3(0, -9.8, 0);

  addPhysicsWorldComponent(world, scene.eid);

  const { playerRig, playerCamera } = createPlayerRig(world);

  return Object.assign<ThreeWorld, Partial<ThreeWorld>>(world, {
    canvas,
    scene,
    renderer,
    gltfLoader,
    rgbeLoader,
    loadingManager,
    pmremGenerator,
    previewCamera,
    playerCamera,
    playerRig,
    activeCamera: previewCamera,
    activeScene: defaultScene,
    audioListener,
    animationMixer,
    dt: 0,
    gravity,
    physicsWorld: new Rapier.World(gravity),
  });
}