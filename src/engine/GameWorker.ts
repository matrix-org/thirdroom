import { addViewMatrix4, addViewVector3, addViewVector4 } from "./component/transform";
import { addView, createCursorBuffer } from './allocator/CursorBuffer'
import { maxEntities } from "./config";
import { processResourceMessage, registerRemoteResourceLoader, RemoteResourceManager, createRemoteResourceManager } from "./resources/RemoteResourceManager";
import { ResourceState } from "./resources/ResourceManager";
import { GLTFRemoteResourceLoader, loadRemoteGLTF } from "./resources/GLTFResourceLoader";
import { createRemoteMesh, MeshRemoteResourceLoader } from "./resources/MeshResourceLoader";
import { copyToWriteBuffer, getReadBufferIndex, swapReadBuffer, swapWriteBuffer, TripleBufferState } from "./TripleBuffer";
import { createInputState, getInputButtonHeld, InputState } from "./input/InputManager";
import { Input } from "./input/InputKeys";
import * as RAPIER from "@dimforge/rapier3d-compat";
import { createRemoteUnlitMaterial, MaterialRemoteResourceLoader } from "./resources/MaterialResourceLoader";
import { createRemoteBoxGeometry, GeometryRemoteResourceLoader } from "./resources/GeometryResourceLoader";

const workerScope = globalThis as typeof globalThis & Worker;

workerScope.addEventListener("message", onMessage);

const gameBuffer = createCursorBuffer();
const renderableBuffer = createCursorBuffer();

const entities: number[] = [];
const rigidBodies: RAPIER.RigidBody[] = [];

const Transform = {
  position: addViewVector3(gameBuffer, maxEntities),
  scale: addViewVector3(gameBuffer, maxEntities),
  rotation: addViewVector3(gameBuffer, maxEntities),
  quaternion: addViewVector4(gameBuffer, maxEntities),

  localMatrix: addViewMatrix4(gameBuffer, maxEntities),
  worldMatrix: addViewMatrix4(renderableBuffer, maxEntities),
  matrixAutoUpdate: addView(gameBuffer, Uint8Array, maxEntities),
  worldMatrixNeedsUpdate: addView(renderableBuffer, Uint8Array, maxEntities),

  parent: addView(gameBuffer, Uint32Array, maxEntities),
  firstChild: addView(gameBuffer, Uint32Array, maxEntities),
  prevSibling: addView(gameBuffer, Uint32Array, maxEntities),
  nextSibling: addView(gameBuffer, Uint32Array, maxEntities),
};

const state: {
  tripleBuffer?: TripleBufferState,
  inputTripleBuffer?: TripleBufferState,
  inputStates?: InputState[],
  physicsWorld?: RAPIER.World,
  frameRate: number,
  renderWorkerPort?: MessagePort,
  then: number,
  rotation: number[],
  resourceManager?: RemoteResourceManager,
  gltfResourceId?: number;
} = {
  tripleBuffer: undefined,
  inputTripleBuffer: undefined,
  inputStates: undefined,
  physicsWorld: undefined,
  frameRate: 0,
  renderWorkerPort: undefined,
  then: 0,
  rotation: [0, 0, 0],
  resourceManager: undefined,
  gltfResourceId: undefined,
};

async function onMessage({ data }: MessageEvent) {
  if (!Array.isArray(data)) {
    processResourceMessage(state.resourceManager!, data);
    return;
  }

  const [type, ...args] = data;

  switch (type) {
    case "init":
      await init(args[0], args[1]);
      break;
    case "start":
      start(args[0], args[1], args[2]);
      break;
  }
}

async function init(inputTripleBuffer: TripleBufferState, renderWorkerPort: MessagePort) {
  console.log("GameWorker initialized");

  await RAPIER.init();

  const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
  state.physicsWorld = new RAPIER.World(gravity);
    
  // Create the ground
  let groundColliderDesc = RAPIER.ColliderDesc.cuboid(100.0, 0.1, 100.0);
  state.physicsWorld.createCollider(groundColliderDesc);

  state.inputTripleBuffer = inputTripleBuffer;
  state.inputStates = inputTripleBuffer.buffers
    .map(buffer => createCursorBuffer(buffer))
    .map(buffer => createInputState(buffer));

  if (renderWorkerPort) {
    state.renderWorkerPort = renderWorkerPort;
    renderWorkerPort.addEventListener("message", onMessage);
    renderWorkerPort.start();
  }
}

const rndRange = (min: number, max: number) => { 
  return Math.random() * (max - min) + min;
}

const createCube = (eid: number, geometryResourceId: number) => {
  entities.push(eid);

  const position = Transform.position[eid];
  const rotation = Transform.rotation[eid];

  position[0] = rndRange(-20, 20);
  position[1] = rndRange(5, 50);
  position[2] = rndRange(-20, 20);

  rotation[0] = rndRange(0,5);
  rotation[1] = rndRange(0,5);
  rotation[2] = rndRange(0,5);

  const materialResourceId = createRemoteUnlitMaterial(state.resourceManager!, {
    baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0]
  });

  const resourceId = createRemoteMesh(state.resourceManager!, geometryResourceId, materialResourceId);

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic()
          .setTranslation(position[0],position[1],position[2]);
  const rigidBody = state.physicsWorld!.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
  const collider = state.physicsWorld!.createCollider(colliderDesc, rigidBody.handle)

  rigidBodies.push(rigidBody);

  createEntity(eid, resourceId);
}

const createEntity = (eid: number, resourceId: number) => {
  const port = state.renderWorkerPort || workerScope;
  port.postMessage(['addEntity', eid, resourceId])
};


const createCamera = (eid: number) => {
  entities.push(eid);

  const position = Transform.position[eid];
  position[0] = 0;
  position[1] = 5;
  position[2] = 40;

  const port = state.renderWorkerPort || globalThis;
  port.postMessage(['addCamera', eid])
}

function start(frameRate: number, tripleBuffer: TripleBufferState, resourceManagerBuffer: SharedArrayBuffer) {
  console.log("GameWorker loop started");
  state.frameRate = frameRate;
  state.tripleBuffer = tripleBuffer;
  const resourceManager = state.resourceManager =
    createRemoteResourceManager(resourceManagerBuffer, state.renderWorkerPort || workerScope);

  registerRemoteResourceLoader(resourceManager, GLTFRemoteResourceLoader);
  registerRemoteResourceLoader(resourceManager, GeometryRemoteResourceLoader);
  registerRemoteResourceLoader(resourceManager, MaterialRemoteResourceLoader);
  registerRemoteResourceLoader(resourceManager, MeshRemoteResourceLoader);

  // state.gltfResourceId = loadRemoteGLTF(state.resourceManager, "/OutdoorFestival.glb");
  
  createCamera(0);

  const geometryResourceId = createRemoteBoxGeometry(state.resourceManager);

  for (let i = 1; i < maxEntities; i++) {
    createCube(i, geometryResourceId);
  }

  update();
}

const inputReadSystem = () => {
  swapReadBuffer(state.inputTripleBuffer!)
}

const cameraMoveSystem = (dt: number) => {
  const eid = 0;
  const position = Transform.position[eid];
  const readableIndex = getReadBufferIndex(state.inputTripleBuffer!);
  const inputState = state.inputStates![readableIndex];
  if (getInputButtonHeld(inputState, Input.ArrowUp))
    position[2] -= dt * 25;
  if (getInputButtonHeld(inputState, Input.ArrowDown))
    position[2] += dt * 25;
  if (getInputButtonHeld(inputState, Input.ArrowLeft))
    position[0] -= dt * 25;
  if (getInputButtonHeld(inputState, Input.ArrowRight))
    position[0] += dt * 25;
}

const speed = 0.5;
const forward = new RAPIER.Vector3(0,0,-speed);
const backward = new RAPIER.Vector3(0,0,speed);
const right = new RAPIER.Vector3(speed,0,0);
const left = new RAPIER.Vector3(-speed,0,0);
const up = new RAPIER.Vector3(0,speed,0);
const cubeMoveSystem = (dt: number) => {
  const eid = 1;
  const rigidBody = rigidBodies[eid];
  const readableIndex = getReadBufferIndex(state.inputTripleBuffer!);
  const inputState = state.inputStates![readableIndex];
  if (getInputButtonHeld(inputState, Input.KeyW))
    rigidBody.applyImpulse(forward, true);
  if (getInputButtonHeld(inputState, Input.KeyS))
    rigidBody.applyImpulse(backward, true);
  if (getInputButtonHeld(inputState, Input.KeyA))
    rigidBody.applyImpulse(left, true);
  if (getInputButtonHeld(inputState, Input.KeyD))
    rigidBody.applyImpulse(right, true);
  if (getInputButtonHeld(inputState, Input.Space))
    rigidBody.applyImpulse(up, true);
}

let createdScene = false;

function gltfLoaderSystem() {
  if (createdScene) {
    return;
  }

  const resource = state.resourceManager!.store.get(state.gltfResourceId!);

  if (resource && resource.state === ResourceState.Loaded) {
    createEntity(0, resource.resourceId);
  }
}

const physicsSystem = (dt: number) => {

  for (let i = 1; i < rigidBodies.length; i++) {
    const eid = entities[i];
    const body = rigidBodies[i];
    const rigidPos = body.translation();
    const rigidRot = body.rotation();
    const position = Transform.position[eid];
    const quaternion = Transform.quaternion[eid];

    position[0] = rigidPos.x;
    position[1] = rigidPos.y;
    position[2] = rigidPos.z;

    quaternion[0] = rigidRot.x;
    quaternion[1] = rigidRot.y;
    quaternion[2] = rigidRot.z;
    quaternion[3] = rigidRot.w;
  }

  state.physicsWorld!.timestep = dt;
  state.physicsWorld!.step()
}

const pipeline = (dt: number) => {
  gltfLoaderSystem();
  inputReadSystem();
  cameraMoveSystem(dt);
  cubeMoveSystem(dt);
  physicsSystem(dt);
}

function update() {
  const start = performance.now();
  const dt = (start - state.then) / 1000;
  state.then = start;

  pipeline(dt);

  copyToWriteBuffer(state.tripleBuffer!, renderableBuffer);
  swapWriteBuffer(state.tripleBuffer!);

  const elapsed = performance.now() - state.then;
  const remainder = 1000 / state.frameRate - elapsed;

  if (remainder > 0) {
    // todo: call fixed timestep physics pipeline here
    setTimeout(update, remainder);
  } else {
    update();
  }
}
