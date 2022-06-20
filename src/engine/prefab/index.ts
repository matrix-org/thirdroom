import * as RAPIER from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";
import { BoxBufferGeometry, SphereGeometry } from "three";

import { GameState } from "../GameTypes";
import { addChild, addTransformComponent, setQuaternionFromEuler, Transform } from "../component/transform";
import { addRigidBody, PhysicsModule } from "../physics/physics.game";
import { getModule, Thread } from "../module/module.common";
import { createRemoteStandardMaterial, RemoteMaterial } from "../material/material.game";
import { createRemoteMesh } from "../mesh/mesh.game";
import { createRemoteAccessor } from "../accessor/accessor.game";
import { AccessorComponentType, AccessorType } from "../accessor/accessor.common";
import { createRemoteBufferView } from "../bufferView/bufferView.game";
import { MeshPrimitiveAttribute } from "../mesh/mesh.common";
import { createRemotePerspectiveCamera } from "../camera/camera.game";
import { addRemoteNodeComponent } from "../node/node.game";
import { createDirectionalLightResource } from "../light/light.game";
import { inflateGLTFScene } from "../gltf/gltf.game";

export const addCubeMesh = (state: GameState, eid: number, size: number, material?: RemoteMaterial) => {
  const geometry = new BoxBufferGeometry(size, size, size);
  const indicesArr = geometry.index!.array as Uint16Array;
  const posArr = geometry.attributes.position.array as Float32Array;
  const normArr = geometry.attributes.normal.array as Float32Array;
  const uvArr = geometry.attributes.uv.array as Float32Array;

  const buffer = new ArrayBuffer(indicesArr.byteLength + posArr.byteLength + normArr.byteLength + uvArr.byteLength);
  let cursor = 0;
  const indices = new Uint16Array(buffer, cursor, indicesArr.length);
  indices.set(indicesArr);
  cursor += indicesArr.byteLength;
  const position = new Float32Array(buffer, cursor, posArr.length);
  position.set(posArr);
  cursor += posArr.byteLength;
  const normal = new Float32Array(buffer, cursor, normArr.length);
  normal.set(normArr);
  cursor += normArr.byteLength;
  const uv = new Float32Array(buffer, cursor, uvArr.length);
  uv.set(uvArr);

  const bufferView = createRemoteBufferView(state, Thread.Render, buffer);

  const remoteMesh = createRemoteMesh(state, {
    indices: createRemoteAccessor(state, {
      type: AccessorType.SCALAR,
      componentType: AccessorComponentType.Uint16,
      bufferView,
      count: indices.length,
    }),
    attributes: {
      [MeshPrimitiveAttribute.POSITION]: createRemoteAccessor(state, {
        type: AccessorType.VEC3,
        componentType: AccessorComponentType.Float32,
        bufferView,
        byteOffset: position.byteOffset,
        count: position.length / 3,
      }),
      [MeshPrimitiveAttribute.NORMAL]: createRemoteAccessor(state, {
        type: AccessorType.VEC3,
        componentType: AccessorComponentType.Float32,
        bufferView,
        byteOffset: normal.byteOffset,
        count: normal.length / 3,
        normalized: true,
      }),
      [MeshPrimitiveAttribute.TEXCOORD_0]: createRemoteAccessor(state, {
        type: AccessorType.VEC2,
        componentType: AccessorComponentType.Float32,
        bufferView,
        byteOffset: uv.byteOffset,
        count: uv.length / 2,
      }),
    },
    material:
      material ||
      createRemoteStandardMaterial(state, {
        baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
        roughnessFactor: 0.8,
        metallicFactor: 0.8,
      }),
  });

  addRemoteNodeComponent(state, eid, {
    mesh: remoteMesh,
  });
};

export const addSphereMesh = (state: GameState, eid: number, radius: number, material?: RemoteMaterial) => {
  const geometry = new SphereGeometry(radius / 2);
  const indicesArr = geometry.index!.array as Uint16Array;
  const posArr = geometry.attributes.position.array as Float32Array;
  const normArr = geometry.attributes.normal.array as Float32Array;
  const uvArr = geometry.attributes.uv.array as Float32Array;

  const buffer = new ArrayBuffer(indicesArr.byteLength + posArr.byteLength + normArr.byteLength + uvArr.byteLength);
  let cursor = 0;
  const indices = new Uint16Array(buffer, cursor, indicesArr.length);
  indices.set(indicesArr);
  cursor += indicesArr.byteLength;
  const position = new Float32Array(buffer, cursor, posArr.length);
  position.set(posArr);
  cursor += posArr.byteLength;
  const normal = new Float32Array(buffer, cursor, normArr.length);
  normal.set(normArr);
  cursor += normArr.byteLength;
  const uv = new Float32Array(buffer, cursor, uvArr.length);
  uv.set(uvArr);

  const bufferView = createRemoteBufferView(state, Thread.Render, buffer);

  const remoteMesh = createRemoteMesh(state, {
    indices: createRemoteAccessor(state, {
      type: AccessorType.SCALAR,
      componentType: AccessorComponentType.Uint16,
      bufferView,
      count: indices.length,
    }),
    attributes: {
      [MeshPrimitiveAttribute.POSITION]: createRemoteAccessor(state, {
        type: AccessorType.VEC3,
        componentType: AccessorComponentType.Float32,
        bufferView,
        byteOffset: position.byteOffset,
        count: position.length / 3,
      }),
      [MeshPrimitiveAttribute.NORMAL]: createRemoteAccessor(state, {
        type: AccessorType.VEC3,
        componentType: AccessorComponentType.Float32,
        bufferView,
        byteOffset: normal.byteOffset,
        count: normal.length / 3,
        normalized: true,
      }),
      [MeshPrimitiveAttribute.TEXCOORD_0]: createRemoteAccessor(state, {
        type: AccessorType.VEC2,
        componentType: AccessorComponentType.Float32,
        bufferView,
        byteOffset: uv.byteOffset,
        count: uv.length / 2,
      }),
    },
    material:
      material ||
      createRemoteStandardMaterial(state, {
        baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
        roughnessFactor: 0.8,
        metallicFactor: 0.8,
      }),
  });

  addRemoteNodeComponent(state, eid, {
    mesh: remoteMesh,
  });
};

export const createCube = (state: GameState, size: number, material?: RemoteMaterial) => {
  const { world } = state;
  const { physicsWorld } = getModule(state, PhysicsModule);
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  addCubeMesh(
    state,
    eid,
    size,
    material ||
      createRemoteStandardMaterial(state, {
        baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
        roughnessFactor: 0.8,
        metallicFactor: 0.8,
      })
  );

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, size / 2, size / 2)
    .setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS)
    .setCollisionGroups(0xffff_ffff)
    .setSolverGroups(0xffff_ffff);

  physicsWorld.createCollider(colliderDesc, rigidBody.handle);

  addRigidBody(world, eid, rigidBody);

  return eid;
};

export function createCamera(state: GameState, setActive = true): number {
  const eid = addEntity(state.world);
  addTransformComponent(state.world, eid);

  const remoteCamera = createRemotePerspectiveCamera(state, {
    yfov: 75,
    znear: 0.1,
  });

  addRemoteNodeComponent(state, eid, {
    camera: remoteCamera,
  });

  if (setActive) {
    state.activeCamera = eid;
  }

  return eid;
}

export function createDirectionalLight(state: GameState, parentEid?: number) {
  const eid = addEntity(state.world);
  addTransformComponent(state.world, eid);

  addRemoteNodeComponent(state, eid, {
    light: createDirectionalLightResource(state),
  });

  if (parentEid !== undefined) {
    addChild(parentEid, eid);
  }

  return eid;
}

export function createGLTFEntity(ctx: GameState, uri: string) {
  const eid = addEntity(ctx.world);
  inflateGLTFScene(ctx, eid, uri);
  return eid;
}

/* Prefab Functions */

export interface PrefabTemplate {
  name: string;
  create: Function;
  delete?: Function;
  serialize?: Function;
  deserialize?: Function;
}

export function registerPrefab(state: GameState, template: PrefabTemplate) {
  if (state.prefabTemplateMap.has(template.name)) {
    console.warn("warning: overwriting existing prefab", template.name);
  }
  state.prefabTemplateMap.set(template.name, template);
  const create = template.create;

  template.create = () => {
    const eid = create();
    state.entityPrefabMap.set(eid, template.name);
    return eid;
  };
}

export function getPrefabTemplate(state: GameState, name: string) {
  return state.prefabTemplateMap.get(name);
}

export function createContainerizedAvatar(ctx: GameState, uri: string) {
  const { physicsWorld } = getModule(ctx, PhysicsModule);

  const container = addEntity(ctx.world);
  addTransformComponent(ctx.world, container);

  const eid = addEntity(ctx.world);
  inflateGLTFScene(ctx, eid, uri, undefined, false);

  Transform.position[eid].set([0, -1, 0]);
  Transform.rotation[eid].set([0, Math.PI, 0]);
  Transform.scale[eid].set([1.3, 1.3, 1.3]);
  setQuaternionFromEuler(Transform.quaternion[eid], Transform.rotation[eid]);

  addChild(container, eid);

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.5).setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS);

  // TODO: collision groups
  // colliderDesc.setCollisionGroups(0x0000_fff0);
  // colliderDesc.setSolverGroups(0x0000_fff0);

  physicsWorld.createCollider(colliderDesc, rigidBody.handle);
  addRigidBody(ctx.world, container, rigidBody);

  return container;
}

// TODO: make a loading entity prefab to display if prefab template hasn't been loaded before deserializing
// add component+system for loading and swapping the prefab
export const createLoadingEntity = createCube;

export const createPrefabEntity = (state: GameState, prefab: string) => {
  const create = state.prefabTemplateMap.get(prefab)?.create;
  if (create) {
    return create(state);
  } else {
    return createLoadingEntity(state, 1);
  }
};
