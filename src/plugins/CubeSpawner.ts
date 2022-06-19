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
      id: "grasp",
      path: "Grasp",
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

const GraspComponent = defineComponent({
  handle1: Types.ui32,
  handle2: Types.ui32,
  joint: [Types.f32, 3],
});
const graspQuery = defineQuery([GraspComponent]);

const GRASP_DISTANCE = 3;
const GRASP_MOVE_SPEED = 10;
const CUBE_THROW_FORCE = 10;

export function GraspSystem(ctx: GameState) {
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);

  let graspedEntitites = graspQuery(ctx.world);

  const graspBtn = input.actions.get("Grasp") as ButtonActionState;
  const throwBtn = input.actions.get("Throw") as ButtonActionState;
  if (throwBtn.pressed && graspedEntitites[0]) {
    const eid = graspedEntitites[0];
    removeComponent(ctx.world, GraspComponent, eid);

    mat4.getRotation(cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.fromValues(0, 0, -1);
    vec3.transformQuat(direction, direction, cameraWorldQuat);
    vec3.scale(direction, direction, CUBE_THROW_FORCE);
    RigidBody.store.get(eid)?.applyImpulse(new RAPIER.Vector3(direction[0], direction[1], direction[2]), true);
  } else if (graspBtn.pressed && graspedEntitites[0]) {
    const eid = graspedEntitites[0];
    removeComponent(ctx.world, GraspComponent, eid);
  } else if (graspBtn.pressed) {
    const cameraMatrix = Transform.worldMatrix[ctx.activeCamera];

    mat4.getRotation(cameraWorldQuat, cameraMatrix);
    const target = vec3.fromValues(0, 0, -1);
    vec3.transformQuat(target, target, cameraWorldQuat);
    vec3.scale(target, target, GRASP_DISTANCE);

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
        addComponent(ctx.world, GraspComponent, eid);
        GraspComponent.joint[eid].set([hitPoint.x, hitPoint.y, hitPoint.z]);
      }
    }
  }

  // note: must call the query again to process any removals that occurred above
  graspedEntitites = graspQuery(ctx.world);
  for (let i = 0; i < graspedEntitites.length; i++) {
    const eid = graspedEntitites[0];

    const graspedPosition = Transform.position[eid];

    const target = vec3.create();
    mat4.getTranslation(target, Transform.worldMatrix[ctx.activeCamera]);

    mat4.getRotation(cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.fromValues(0, 0, 1);
    vec3.transformQuat(direction, direction, cameraWorldQuat);
    vec3.scale(direction, direction, GRASP_DISTANCE);

    vec3.sub(target, target, direction);

    vec3.sub(target, target, graspedPosition);

    vec3.scale(target, target, GRASP_MOVE_SPEED);

    const body = RigidBody.store.get(eid);
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
    const direction = vec3.fromValues(0, 0, -1);
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
