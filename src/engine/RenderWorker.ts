import { addView, createCursorBuffer } from "./allocator/CursorBuffer";
import { addViewMatrix4, addViewVector3, addViewVector4 } from "./component/transform";
import { createTripleBuffer, swapReadBuffer, getReadBufferIndex } from "./TripleBuffer";
import { maxEntities } from './config';
import {
  AmbientLight,
  WebGLRenderer,
  Scene,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Euler,
  Clock,
  Vector3,
  Camera,
  Mesh,
} from "three";
import { createResourceManager, processRemoteResourceMessage, registerResourceLoader, ResourceManager } from "./resources/ResourceManager";
import { GLTFResourceLoader } from "./resources/GLTFResourceLoader";
import { MeshResourceLoader } from "./resources/MeshResourceLoader";
import { MaterialResourceLoader } from "./resources/MaterialResourceLoader";
import { GeometryResourceLoader } from "./resources/GeometryResourceLoader";

const objects: Object3D[] = [];

if (typeof (window as any) === "undefined") {
  self.window = self;
  globalThis.addEventListener("message", onMainThreadMessage);
}

const state: {
  needsResize: boolean,
  canvasWidth: number,
  canvasHeight: number,
  scene?: Object3D;
  resourceManager?: ResourceManager
} = {
  needsResize: true,
  canvasWidth: 0,
  canvasHeight: 0,
  scene: undefined,
  resourceManager: undefined,
};

const addObject3DQueue: [number, number][] = [];
const addCameraQueue: number[] = [];
const cameras: PerspectiveCamera[] = [];

function onMainThreadMessage({ data }: MessageEvent) {
  if (!Array.isArray(data)) {
    processRemoteResourceMessage(state.resourceManager!, data);
    return;
  }

  const [type, ...args] = data;

  switch (type) {
    case "init":
      init(args[0], args[1], args[2], args[3]);
      break;
    case "resize":
      resize(args[0], args[1]);
      break;
    case "addEntity": {
      const eid = args[0];
      const resourceId = args[1];
      addObject3DQueue.push([eid, resourceId])
      break;
    }
    case "addCamera": {
      const eid = args[0];
      addCameraQueue.push(eid)
      break;
    }
  }
}

type Object3DEntity = (Object3D | Mesh | PerspectiveCamera) & { eid: number}

const addObject3D = (eid: number, resourceId: number) => {
  const obj = state.resourceManager!.store.get(resourceId)!.resource as Object3D;
  (obj as Object3DEntity).eid = eid;
  objects.push(obj);
  state.scene!.add(obj);
}

const addCamera = (eid: number, obj: PerspectiveCamera = new PerspectiveCamera(
  70,
  state.canvasWidth / state.canvasHeight,
  0.1,
  1000
)) => {
  (obj as Object3DEntity).eid = eid;
  objects.push(obj);
  cameras.push(obj);
  state.scene!.add(obj);
}

export function resize(width: number, height: number) {
  state.needsResize = true;
  state.canvasWidth = width;
  state.canvasHeight = height;
}

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

export const init = async (
  gameWorkerPort: MessagePort,
  canvas: HTMLCanvasElement,
  initCanvasWidth: number,
  initCanvasHeight: number
) => {

  gameWorkerPort.onmessage = onMainThreadMessage
  
  const size = maxEntities

  const tripleBuffer = createTripleBuffer();

  const TransformViews = tripleBuffer.buffers
    .map(buffer => createCursorBuffer(buffer))
    .map(buffer => ({
      position: addViewVector3(buffer, size),
      scale: addViewVector3(buffer, size),
      rotation: addViewVector3(buffer, size),
      quaternion: addViewVector4(buffer, size),
      
      localMatrix: addViewMatrix4(buffer, size),
      worldMatrix: addViewMatrix4(buffer, size),
      matrixAutoUpdate: addView(buffer, Uint8Array, size),
      worldMatrixNeedsUpdate: addView(buffer, Uint8Array, size),
    }));
  
    state.canvasWidth = initCanvasWidth;
    state.canvasHeight = initCanvasHeight;
  
    const scene = state.scene = new Scene();

    const resourceManager = createResourceManager(gameWorkerPort);
    registerResourceLoader(resourceManager, GLTFResourceLoader);
    registerResourceLoader(resourceManager, GeometryResourceLoader);
    registerResourceLoader(resourceManager, MaterialResourceLoader);
    registerResourceLoader(resourceManager, MeshResourceLoader);
    state.resourceManager = resourceManager;
  
    scene.add(new AmbientLight(0xffffff, 0.5));
  
    // const boxMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    // const boxGeometry = new BoxBufferGeometry();
    // const box = new Mesh(boxGeometry, boxMaterial);
    // scene.add(box);
  
    const renderer = new WebGLRenderer({ antialias: true, canvas });
  
    // const euler = new Euler();
    // const quat = new Quaternion();
    // const pos = new Vector3();

    const eulers = Array(maxEntities).fill(null).map(() => new Euler())
    const quats = Array(maxEntities).fill(null).map(() => new Quaternion())
    const poss = Array(maxEntities).fill(null).map(() => new Vector3())
  
    const clock = new Clock();
  
    // Can likely scale this dynamically depending on worker frame rate
    // renderer.setPixelRatio() can be used to scale main thread frame rate
    const workerFrameRate = 60;

    renderer.setAnimationLoop(() => {
      const dt = clock.getDelta();
      const frameRate = 1 / dt;
      const lerpAlpha = clamp(workerFrameRate / frameRate, 0 , 1);

      while (addObject3DQueue.length) {
        const [eid, resourceId] = addObject3DQueue.shift()!;
        addObject3D(eid, resourceId);
      }
  
      while (addCameraQueue.length) {
        addCamera(addCameraQueue.shift()!)
      }
  
      if (swapReadBuffer(tripleBuffer)) {
        const bufferIndex = getReadBufferIndex(tripleBuffer);
        const Transform = TransformViews[bufferIndex];

        for (let i = 0; i < objects.length; i++) {
          const obj = objects[i];
          const { eid } = obj as Object3D & { eid: number };
          const position = Transform.position[eid];
          const rotation = Transform.rotation[eid];
          const quaternion = Transform.quaternion[eid];
          const euler = eulers[eid];
          const quat = quats[eid];
          const pos = poss[eid];
          // quat.setFromEuler(euler.fromArray(rotation as unknown as number[]));
          quat.fromArray(quaternion);
          pos.fromArray(position);
        }

      }

      // todo: only sync matrices
      //  - decompose into components
      //  - lerp each component
      //  - recompose and apply matrix to object3d
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const { eid } = obj as Object3DEntity;

        const quat = quats[eid];
        const pos = poss[eid];

        obj.position.lerp(pos, lerpAlpha);
        obj.quaternion.slerp(quat, lerpAlpha);
      }

      const camera = cameras[0];
      if (camera) {

        if (state.needsResize) {
          camera.aspect = state.canvasWidth / state.canvasHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(state.canvasWidth, state.canvasHeight, false);
        }
        
        renderer.render(scene, camera);
      }
    });
    
    gameWorkerPort.postMessage(["start", workerFrameRate, tripleBuffer, resourceManager.buffer]);

    console.log("RenderWorker initialized");
}

// for when renderer is on main thread
export const postMessage = (data: any) => onMainThreadMessage({ data } as MessageEvent);