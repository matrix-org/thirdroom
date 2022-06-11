import * as RAPIER from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";

import { GameState } from "../GameTypes";
import { addChild, addTransformComponent, setQuaternionFromEuler, Transform } from "../component/transform";
import { addRigidBody, PhysicsModule } from "../physics/physics.game";
import { playAudio } from "../audio/audio.game";
import { getModule, Thread } from "../module/module.common";
import { createRemoteStandardMaterial, RemoteMaterial } from "../material/material.game";
import { createRemoteMesh } from "../mesh/mesh.game";
import { createRemoteAccessor } from "../accessor/accessor.game";
import { AccessorComponentType, AccessorType } from "../accessor/accessor.common";
import { createRemoteBufferView } from "../bufferView/bufferView.game";
import { MeshPrimitiveAttribute } from "../mesh/mesh.common";
import { createRemotePerspectiveCamera } from "../camera/camera.game";
import { addGLTFLoaderComponent } from "../../gltf/gltf.game";
import { addRemoteNodeComponent } from "../node/node.game";
import { createDirectionalLightResource } from "../light/light.game";

export const addCubeMesh = (state: GameState, eid: number, material?: RemoteMaterial) => {
  const buffer = new ArrayBuffer(32);
  const indices = new Uint16Array(buffer, 0);
  const position = new Float32Array(buffer, indices.byteLength);

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
        byteOffset: indices.byteLength,
        count: position.length / 3,
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

export const createCube = (state: GameState, material?: RemoteMaterial) => {
  const { world } = state;
  const { physicsWorld } = getModule(state, PhysicsModule);
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  addCubeMesh(
    state,
    eid,
    material ||
      createRemoteStandardMaterial(state, {
        baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
        roughnessFactor: 0.8,
        metallicFactor: 0.8,
      })
  );

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS);
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

export function registerDefaultPrefabs(state: GameState) {
  registerPrefab(state, {
    name: "random-cube",
    create: createCube,
  });
  registerPrefab(state, {
    name: "red-cube",
    create: () => {
      const eid = createCube(
        state,
        createRemoteStandardMaterial(state, {
          baseColorFactor: [1, 0, 0, 1.0],
          roughnessFactor: 0.8,
          metallicFactor: 0.8,
        })
      );
      return eid;
    },
  });
  registerPrefab(state, {
    name: "musical-cube",
    create: () => {
      const eid = createCube(
        state,
        createRemoteStandardMaterial(state, {
          baseColorFactor: [1, 0, 0, 1.0],
          roughnessFactor: 0.8,
          metallicFactor: 0.8,
        })
      );

      playAudio("/audio/bach.mp3", eid);

      return eid;
    },
  });
  registerPrefab(state, {
    name: "green-cube",
    create: () =>
      createCube(
        state,
        createRemoteStandardMaterial(state, {
          baseColorFactor: [0, 1, 0, 1.0],
          roughnessFactor: 0.8,
          metallicFactor: 0.8,
        })
      ),
  });
  registerPrefab(state, {
    name: "blue-cube",
    create: () =>
      createCube(
        state,
        createRemoteStandardMaterial(state, {
          baseColorFactor: [0, 0, 1, 1.0],
          roughnessFactor: 0.8,
          metallicFactor: 0.8,
        })
      ),
  });
  registerPrefab(state, {
    name: "player-cube",
    create: () =>
      createCube(
        state,
        createRemoteStandardMaterial(state, {
          baseColorFactor: [1, 1, 1, 1.0],
          roughnessFactor: 0.1,
          metallicFactor: 0.9,
        })
      ),
  });
  registerPrefab(state, {
    name: "mixamo-x",
    create: () => {
      return createRotatedAvatar(state, "/gltf/mixamo-x.glb");
    },
  });
  registerPrefab(state, {
    name: "mixamo-y",
    create: () => {
      return createRotatedAvatar(state, "/gltf/mixamo-y.glb");
    },
  });
}

function createRotatedAvatar(state: GameState, path: string) {
  const { physicsWorld } = getModule(state, PhysicsModule);

  const container = addEntity(state.world);
  addTransformComponent(state.world, container);

  const eid = addEntity(state.world);

  addGLTFLoaderComponent(state, eid, path);

  Transform.position[eid].set([0, -0.5, 0]);
  Transform.rotation[eid].set([0, Math.PI, 0]);
  Transform.scale[eid].set([1.3, 1.3, 1.3]);
  setQuaternionFromEuler(Transform.quaternion[eid], Transform.rotation[eid]);

  addChild(container, eid);

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS);
  physicsWorld.createCollider(colliderDesc, rigidBody.handle);
  addRigidBody(state.world, container, rigidBody);

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
    return createLoadingEntity(state);
  }
};
