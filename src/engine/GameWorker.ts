import { addViewMatrix4, addViewVector3, addViewVector4 } from "./component/transform";
import { addView, createCursorBuffer } from './allocator/CursorBuffer'
import { maxEntities, tickRate } from "./config";
import { registerRemoteResourceLoader, RemoteResourceManager, createRemoteResourceManager } from "./resources/RemoteResourceManager";
import { GLTFRemoteResourceLoader } from "./resources/GLTFResourceLoader";
import { createRemoteMesh, MeshRemoteResourceLoader } from "./resources/MeshResourceLoader";
import { copyToWriteBuffer, getReadBufferIndex, swapReadBuffer, swapWriteBuffer, TripleBufferState } from "./TripleBuffer";
import { createInputState, getInputButtonHeld, InputState } from "./input/InputManager";
import { Input } from "./input/InputKeys";
import * as RAPIER from "@dimforge/rapier3d-compat";
import { createRemoteUnlitMaterial, MaterialRemoteResourceLoader } from "./resources/MaterialResourceLoader";
import { createRemoteBoxGeometry, GeometryRemoteResourceLoader } from "./resources/GeometryResourceLoader";
import { InitializeGameWorkerMessage, WorkerMessages, WorkerMessageType } from "./WorkerMessage";

const workerScope = globalThis as typeof globalThis & Worker;

async function onInitMessage({ data }: { data: WorkerMessages } ) {
  if (typeof data !== "object") {
    return;
  }

  const message = data as WorkerMessages;

  if (message.type === WorkerMessageType.InitializeGameWorker) {
    const state = await onInit(message);

    if (state.renderWorkerMessagePort) {
      state.renderWorkerMessagePort.addEventListener("message", onMessage(state));
      state.renderWorkerMessagePort.start();
    }

    workerScope.removeEventListener("message", onInitMessage);
    workerScope.addEventListener("message", onMessage(state));
  }
}

workerScope.addEventListener("message", onInitMessage);

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
  interpolate: addView(renderableBuffer, Uint8Array, maxEntities),

  parent: addView(gameBuffer, Uint32Array, maxEntities),
  firstChild: addView(gameBuffer, Uint32Array, maxEntities),
  prevSibling: addView(gameBuffer, Uint32Array, maxEntities),
  nextSibling: addView(gameBuffer, Uint32Array, maxEntities),
};

interface GameWorkerState {
  renderableTripleBuffer: TripleBufferState,
  inputTripleBuffer: TripleBufferState,
  inputStates: InputState[],
  physicsWorld: RAPIER.World,
  renderWorkerMessagePort?: MessagePort,
  then: number,
  resourceManager: RemoteResourceManager,
}

async function onInit({
  inputTripleBuffer,
  resourceManagerBuffer,
  renderWorkerMessagePort,
  renderableTripleBuffer,
}: InitializeGameWorkerMessage): Promise<GameWorkerState> {
  console.log("GameWorker initialized");

  await RAPIER.init();

  const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
  const physicsWorld = new RAPIER.World(gravity);
    
  // Create the ground
  let groundColliderDesc = RAPIER.ColliderDesc.cuboid(100.0, 0.1, 100.0);
  physicsWorld.createCollider(groundColliderDesc);

  const inputStates = inputTripleBuffer.buffers
    .map(buffer => createCursorBuffer(buffer))
    .map(buffer => createInputState(buffer));

  console.log("GameWorker loop started");
  const resourceManager =
    createRemoteResourceManager(resourceManagerBuffer, renderWorkerMessagePort || workerScope);

  registerRemoteResourceLoader(resourceManager, GLTFRemoteResourceLoader);
  registerRemoteResourceLoader(resourceManager, GeometryRemoteResourceLoader);
  registerRemoteResourceLoader(resourceManager, MaterialRemoteResourceLoader);
  registerRemoteResourceLoader(resourceManager, MeshRemoteResourceLoader);

  const state = {
    renderableTripleBuffer,
    inputTripleBuffer,
    resourceManager,
    then: performance.now(),
    inputStates,
    physicsWorld,
    renderWorkerMessagePort
  };

  createCamera(state, 0);

  const geometryResourceId = createRemoteBoxGeometry(resourceManager);

  for (let i = 1; i < maxEntities; i++) {
    createCube(state, i, geometryResourceId);
  }


  update(state);

  return state;
}

const onMessage = (state: GameWorkerState) => ({ data }: { data: WorkerMessages }) => {
  if (typeof data !== "object") {
    return;
  }

  const message = data as WorkerMessages;
};

const rndRange = (min: number, max: number) => { 
  return Math.random() * (max - min) + min;
}

const createCube = (state: GameWorkerState, eid: number, geometryResourceId: number) => {
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

  createEntity(state, eid, resourceId);
}

const createEntity = (state: GameWorkerState, eid: number, resourceId: number) => {
  const port = state.renderWorkerMessagePort || workerScope;
  port.postMessage(['addEntity', eid, resourceId])
};


const createCamera = (state: GameWorkerState, eid: number) => {
  entities.push(eid);

  const position = Transform.position[eid];
  position[0] = 0;
  position[1] = 5;
  position[2] = 40;

  const port = state.renderWorkerMessagePort || globalThis;
  port.postMessage(['addCamera', eid])
}

const inputReadSystem = (state: GameWorkerState) => {
  swapReadBuffer(state.inputTripleBuffer)
}

const cameraMoveSystem = (state: GameWorkerState, dt: number) => {
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
const cubeMoveSystem = (state: GameWorkerState, dt: number) => {
  const eid = 1;
  const rigidBody = rigidBodies[eid];
  const readableIndex = getReadBufferIndex(state.inputTripleBuffer);
  const inputState = state.inputStates[readableIndex];
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

const physicsSystem = (state: GameWorkerState, dt: number) => {

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

const pipeline = (state: GameWorkerState, dt: number) => {
  inputReadSystem(state);
  cameraMoveSystem(state, dt);
  cubeMoveSystem(state, dt);
  physicsSystem(state, dt);
}

function update(state: GameWorkerState) {
  const start = performance.now();
  const dt = (start - state.then) / 1000;
  state.then = start;

  pipeline(state, dt);

  copyToWriteBuffer(state.renderableTripleBuffer, renderableBuffer);
  swapWriteBuffer(state.renderableTripleBuffer);

  const elapsed = performance.now() - state.then;
  const remainder = 1000 / tickRate - elapsed;

  if (remainder > 0) {
    // todo: call fixed timestep physics pipeline here
    setTimeout(update, remainder);
  } else {
    update(state);
  }
}
