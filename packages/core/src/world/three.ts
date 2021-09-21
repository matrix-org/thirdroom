import { addComponent, defineComponent, addEntity, removeEntity } from "bitecs";
import { Object3D, Scene, PerspectiveCamera, AudioListener } from "three";
import { World } from "./World";

export const Object3DComponent = defineComponent({});

export function addObject3DEntity(
  world: World,
  obj: Object3D,
  parent?: Object3D
): number {
  const eid = addEntity(world);
  addObject3D(world, eid, obj, parent);
  return eid;
}

export function addObject3D<T extends Object3D>(
  world: World,
  eid: number,
  obj: T,
  parent?: Object3D
): T {
  if (parent) {
    parent.add(obj);
  }

  addComponent(world, Object3DComponent, eid);
  world.entityToObject3D[eid] = obj;
  world.object3DToEntity.set(obj, eid);

  return obj;
}

export function getObject3D<T extends Object3D>(world: World, eid: number): T {
  return world.entityToObject3D[eid] as T;
}

export function setObject3D(world: World, eid: number, obj: Object3D): void {
  const oldObj = world.entityToObject3D[eid];
  const parent = oldObj && oldObj.parent;

  removeObject3D(world, eid);

  if (parent) {
    parent.add(obj);
  }

  world.entityToObject3D[eid] = obj;
  world.object3DToEntity.set(obj, eid);
}

export function removeObject3D(world: World, eid: number) {
  const obj = world.entityToObject3D[eid];

  if (!obj) {
    return;
  }

  obj.removeFromParent();
  world.object3DToEntity.delete(obj);
  delete world.entityToObject3D[eid];

  obj.traverse((child) => {
    if (child === obj) {
      return;
    }

    const childEid = world.object3DToEntity.get(child);

    if (childEid) {
      removeEntity(world, childEid);
      world.object3DToEntity.delete(child);
      delete world.entityToObject3D[childEid];
    }
  });
}

export function removeObject3DEntity(world: World, eid: number) {
  removeObject3D(world, eid);
  removeEntity(world, eid);
}

export function detatchObject3D<T extends Object3D>(
  world: World,
  eid: number
): T | undefined {
  const obj = world.entityToObject3D[eid];

  if (!obj) {
    return;
  }

  obj.removeFromParent();
  world.object3DToEntity.delete(obj);
  delete world.entityToObject3D[eid];

  return obj as T;
}

export function ThreeModule(world: World) {
  world.entityToObject3D = [];
  world.object3DToEntity = new Map();

  const scene = new Scene();
  const camera = new PerspectiveCamera();
  world.sceneEid = addObject3DEntity(world, scene);
  world.cameraEid = addObject3DEntity(world, camera);
  const playerRig = new Object3D();
  const playerRigEid = addObject3DEntity(world, playerRig, scene);
  world.playerRigEid = playerRigEid;
  playerRig.add(camera);

  playerRig.position.set(0, 0.1, 5);
  camera.position.set(0, 1.6, 0);

  const audioListener = new AudioListener();
  world.audioListenerEid = addObject3DEntity(world, audioListener, camera);

  return {
    scene,
    camera,
    playerRig,
    audioListener,
  };
}
