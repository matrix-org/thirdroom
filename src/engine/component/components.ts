import RAPIER from "@dimforge/rapier3d-compat";

import { PropTypes } from "../ecs/prop-types";

interface MapStore<T> {
  get(key: number): T | undefined;
  set(key: number, value: T): void;
  delete(key: number): void;
  dispose(): void;
}

function createMapStore<T>(): MapStore<T> {
  const store: Map<number, T> = new Map();

  return {
    get(key: number): T | undefined {
      return store.get(key);
    },
    set(key: number, value: T): void {
      store.set(key, value);
    },
    delete(key: number): void {
      store.delete(key);
    },
    dispose(): void {},
  };
}

const createPropDef =
  <T>(name: string, store: PropStore<T>) =>
  (defaultValue: T) => {
    return {
      name,
      store,
      get required() {
        return {
          name,
          store,
          required: true,
        };
      },
    };
  };

type PropType = typeof PropTypes;

type StoreSchema = PropType | { [key: string]: PropType } | undefined;

interface Schema {
  name: string;
  store?: StoreSchema;
}

interface Component<S extends Schema = Schema> {
  schema: S;
}

function defineComponent<S extends Schema>(schema: S): Component<S> {
  return {
    schema,
  };
}

export const Name = defineComponent({
  name: "Name",
  store: PropTypes.string.required,
});

export const Player = defineComponent({
  name: "Player",
});

export const SpawnPoint = defineComponent({
  name: "SpawnPoint",
});

export const Transform = defineComponent({
  name: "Transform",
  store: {
    position: PropTypes.vec3,
    rotation: PropTypes.euler,
    quaternion: PropTypes.quat,
    scale: PropTypes.vec3([1, 1, 1]),
    localMatrix: PropTypes.mat4,
    worldMatrix: PropTypes.mat4,
    static: PropTypes.boolean,
    worldMatrixNeedsUpdate: PropTypes.boolean(true),
    parent: PropTypes.eid,
    firstChild: PropTypes.eid,
    prevSibling: PropTypes.eid,
    nextSibling: PropTypes.eid,
  },
});

export const Selected = defineComponent({
  name: "Selected",
});

export const Networked = defineComponent({
  name: "Networked",
  store: {
    networkId: PropTypes.ui32,
    position: PropTypes.vec3,
    quaternion: PropTypes.quat,
    velocity: PropTypes.vec3,
  },
});

export const Owned = defineComponent({
  name: "Owned",
});

export const RemoteNodeComponent = defineComponent({
  name: "RemoteNodeComponent",
  store: PropTypes.ref<RemoteNode>(),
});

export const RigidBody = defineComponent({
  name: "RigidBody",
  store: {
    velocity: PropTypes.vec3,
    object: PropTypes.ref<RAPIER.RigidBody>(),
  },
});

export const Prefab = defineComponent({
  name: "Prefab",
  store: PropTypes.string.required,
});

export const RemoteSceneComponent = defineComponent({
  name: "RemoteSceneComponent",
  store: PropTypes.ref<RemoteScene>().required,
});

export const FirstPersonCameraPitchTarget = defineComponent({
  name: "FirstPersonCameraPitchTarget",
  store: {
    maxAngle: PropTypes.f32(89),
    minAngle: PropTypes.f32(-89),
    sensitivity: PropTypes.f32(1),
  },
});

export const FirstPersonCameraYawTarget = defineComponent({
  name: "FirstPersonCameraYawTarget",
  store: {
    sensitivity: PropTypes.f32(1),
  },
});

export const FlyPlayerRig = defineComponent({
  name: "FlyPlayerRig",
  store: {
    speed: PropTypes.f32(10),
  },
});

export const GrabComponent = defineComponent({
  name: "GrabComponent",
  store: {
    handle1: PropTypes.ui32.required,
    handle2: PropTypes.ui32.required,
    joint: PropTypes.vec3,
  },
});

export const PlayerRig = defineComponent({
  name: "PlayerRig",
});
