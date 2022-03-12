import { addEntity, AudioListenerEntity, createWorld, Object3DEntity, PerspectiveCameraEntity, SceneEntity, World } from "threecs";
import {
  AnimationMixer,
  Camera,
  LoadingManager,
  Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  sRGBEncoding,
  UnsignedByteType,
  WebGLRenderer,
  AudioListener,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import Rapier from "@dimforge/rapier3d-compat";

export interface ThreeWorld extends World {
  renderer: WebGLRenderer;
  canvas: HTMLCanvasElement;
  gltfLoader: GLTFLoader;
  rgbeLoader: RGBELoader;
  loadingManager: LoadingManager;
  pmremGenerator: PMREMGenerator;
  defaultCamera: PerspectiveCamera;
  activeCamera: Camera;
  activeScene: Object3D;
  audioListener: AudioListener;
  animationMixer: AnimationMixer;
  gravity: Rapier.Vector3;
  physicsWorld: Rapier.World;
}

export async function createThreeWorld(canvas: HTMLCanvasElement): Promise<ThreeWorld> {
  await Rapier.init();

  const world = createWorld<ThreeWorld>();
  world.dt = 0;
  world.time = 0;
  world.objectEntityMap = new Map();
  world.input = new Map();
  world.actionMaps = [];
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

  const pmremGenerator = new PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const scene = new SceneEntity(world);

  const defaultCamera = new PerspectiveCameraEntity(
    world,
    70,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  scene.add(defaultCamera);
  defaultCamera.position.z = 3;

  const audioListener = new AudioListenerEntity(world);
  defaultCamera.add(audioListener);

  const defaultScene = new Object3DEntity(world);
  scene.add(defaultScene);

  const animationMixer = new AnimationMixer(scene as unknown as Object3D);

  const gravity = new Rapier.Vector3(0, -9.8, 0);

  return Object.assign(world, {
    canvas,
    scene,
    renderer,
    gltfLoader,
    rgbeLoader,
    loadingManager,
    pmremGenerator,
    defaultCamera,
    activeCamera: defaultCamera,
    activeScene: defaultScene,
    audioListener,
    animationMixer,
    dt: 0,
    gravity,
    physicsWorld: new Rapier.World(gravity),
  });
}