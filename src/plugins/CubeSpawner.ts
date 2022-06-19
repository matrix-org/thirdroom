import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, defineComponent, defineQuery, removeComponent, Types } from "bitecs";
import { mat4, vec3, quat } from "gl-matrix";

import {
  createRemoteAudioData,
  createRemoteAudioSource,
  playAudio,
  RemoteAudioSource,
  addAudioEmitterComponent,
  RemoteAudioEmitter,
} from "../engine/audio/audio.game";
import { Transform, addChild } from "../engine/component/transform";
import { NOOP } from "../engine/config.common";
import { GameState } from "../engine/GameTypes";
import {
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
  enableActionMap,
} from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { createRemoteStandardMaterial } from "../engine/material/material.game";
import { defineModule, getModule } from "../engine/module/module.common";
import { Networked, Owned } from "../engine/network/network.game";
import { addRemoteNodeComponent } from "../engine/node/node.game";
import { PhysicsModule, RigidBody } from "../engine/physics/physics.game";
import { createCube, createPrefabEntity, registerPrefab } from "../engine/prefab";
import randomRange from "../engine/utils/randomRange";

type CubeSpawnerModuleState = {
  hitAudioEmitters: Map<number, RemoteAudioEmitter>;
};

export const CubeSpawnerModule = defineModule<GameState, CubeSpawnerModuleState>({
  name: "cube-spawner",
  create() {
    return {
      hitAudioEmitters: new Map(),
    };
  },
  init(ctx) {
    const module = getModule(ctx, CubeSpawnerModule);

    const cubeMaterial = createRemoteStandardMaterial(ctx, {
      baseColorFactor: [0, 0, 1, 1.0],
      roughnessFactor: 0.8,
      metallicFactor: 0.8,
    });

    const hitAudioData = createRemoteAudioData(ctx, "/audio/hit.wav");

    registerPrefab(ctx, {
      name: "blue-cube",
      create: () => {
        const eid = createCube(ctx, cubeMaterial);

        const hitAudioSource = createRemoteAudioSource(ctx, {
          audio: hitAudioData,
          loop: false,
          autoPlay: false,
        });

        const audioEmitter = addAudioEmitterComponent(ctx, eid, {
          sources: [hitAudioSource],
        });

        addRemoteNodeComponent(ctx, eid, {
          audioEmitter,
        });

        module.hitAudioEmitters.set(eid, audioEmitter);

        return eid;
      },
    });

    // TODO: figure out why global emitters don't activate until a positional emitter is created/activated
    // const audioEmitter = createRemoteGlobalAudioEmitter(ctx, {
    //   sources: [hitAudioSource],
    // });
    // setInterval(() => {
    //   playAudio(hitAudioSource);
    // }, 1000);

    enableActionMap(ctx, CubeSpawnerActionMap);
  },
});

export const CubeSpawnerActionMap: ActionMap = {
  id: "cube-spawner",
  actions: [
    {
      id: "spawnCube",
      path: "SpawnCube",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyF",
        },
      ],
    },
    {
      id: "grab",
      path: "Grab",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Mouse/Left",
        },
      ],
    },
    {
      id: "throw",
      path: "Throw",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Mouse/Right",
        },
      ],
    },
  ],
};

const GrabComponent = defineComponent({
  handle1: Types.ui32,
  handle2: Types.ui32,
  joint: [Types.f32, 3],
});
const grabQuery = defineQuery([GrabComponent]);

const GRAB_DISTANCE = 3;
const GRAB_MOVE_SPEED = 10;
const CUBE_THROW_FORCE = 10;

const _direction = vec3.create();
const _target = vec3.create();

export function GrabSystem(ctx: GameState) {
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);

  let heldEntity = grabQuery(ctx.world)[0];

  const grabBtn = input.actions.get("Grab") as ButtonActionState;
  const throwBtn = input.actions.get("Throw") as ButtonActionState;

  // if holding and entity and throw is pressed
  if (heldEntity && throwBtn.pressed) {
    removeComponent(ctx.world, GrabComponent, heldEntity);

    mat4.getRotation(cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(_direction, 0, 0, -1);
    vec3.transformQuat(direction, direction, cameraWorldQuat);
    vec3.scale(direction, direction, CUBE_THROW_FORCE);

    // fire!
    RigidBody.store.get(heldEntity)?.applyImpulse(new RAPIER.Vector3(direction[0], direction[1], direction[2]), true);

    // if holding an entity and grab is pressed again
  } else if (grabBtn.pressed && heldEntity) {
    // release
    removeComponent(ctx.world, GrabComponent, heldEntity);
    heldEntity = NOOP;

    // if grab is pressed
  } else if (grabBtn.pressed) {
    // raycast outward from camera
    const cameraMatrix = Transform.worldMatrix[ctx.activeCamera];
    mat4.getRotation(cameraWorldQuat, cameraMatrix);

    const target = vec3.set(_target, 0, 0, -1);
    vec3.transformQuat(target, target, cameraWorldQuat);
    vec3.scale(target, target, GRAB_DISTANCE);

    const source = mat4.getTranslation(vec3.create(), cameraMatrix);

    const s: RAPIER.Vector3 = (([x, y, z]) => ({ x, y, z }))(source);
    const t: RAPIER.Vector3 = (([x, y, z]) => ({ x, y, z }))(target);

    const ray = new RAPIER.Ray(s, t);
    const maxToi = 4.0;
    const solid = true;
    const groups = 0xfffffffff;

    const hit = physics.physicsWorld.castRay(ray, maxToi, solid, groups);
    if (hit != null) {
      const hitPoint = ray.pointAt(hit.toi); // ray.origin + ray.dir * toi
      const eid = physics.handleMap.get(hit.colliderHandle);
      if (!eid) {
        console.warn(`Could not find entity for physics handle ${hit.colliderHandle}`);
      } else if (ctx.entityPrefabMap.get(eid) === "blue-cube") {
        addComponent(ctx.world, GrabComponent, eid);
        GrabComponent.joint[eid].set([hitPoint.x, hitPoint.y, hitPoint.z]);
      }
    }
  }

  // if still holding entity, move towards the grab point
  if (heldEntity) {
    const heldPosition = Transform.position[heldEntity];

    const target = _target;
    mat4.getTranslation(target, Transform.worldMatrix[ctx.activeCamera]);

    mat4.getRotation(cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(_direction, 0, 0, 1);
    vec3.transformQuat(direction, direction, cameraWorldQuat);
    vec3.scale(direction, direction, GRAB_DISTANCE);

    vec3.sub(target, target, direction);

    vec3.sub(target, target, heldPosition);

    vec3.scale(target, target, GRAB_MOVE_SPEED);

    const body = RigidBody.store.get(heldEntity);
    if (body) {
      body.setLinvel(new RAPIER.Vector3(target[0], target[1], target[2]), true);
    }
  }
}

const cameraWorldQuat = quat.create();
export const CubeSpawnerSystem = (ctx: GameState) => {
  const module = getModule(ctx, CubeSpawnerModule);
  const input = getModule(ctx, InputModule);
  const physics = getModule(ctx, PhysicsModule);

  const spawnCube = input.actions.get("SpawnCube") as ButtonActionState;
  if (spawnCube.pressed) {
    const cube = createPrefabEntity(ctx, "blue-cube");

    addComponent(ctx.world, Networked, cube);
    addComponent(ctx.world, Owned, cube);

    mat4.getTranslation(Transform.position[cube], Transform.worldMatrix[ctx.activeCamera]);

    mat4.getRotation(cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(_direction, 0, 0, -1);
    vec3.transformQuat(direction, direction, cameraWorldQuat);
    vec3.scale(direction, direction, CUBE_THROW_FORCE);
    RigidBody.store.get(cube)?.applyImpulse(new RAPIER.Vector3(direction[0], direction[1], direction[2]), true);

    addChild(ctx.activeScene, cube);
  }

  physics.drainContactEvents((eid1?: number, eid2?: number) => {
    const playbackRate = randomRange(0.25, 0.75);
    const emitter = module.hitAudioEmitters.get(eid2!)! || module.hitAudioEmitters.get(eid1!)!;
    const source = emitter.sources[0] as RemoteAudioSource;
    playAudio(source, { playbackRate });
  });
};
