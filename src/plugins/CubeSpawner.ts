import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent } from "bitecs";
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
      id: "pickUp",
      path: "PickUp",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Mouse/Left",
        },
      ],
    },
  ],
};

const cameraWorldQuat = quat.create();
export const CubeSpawnerSystem = (ctx: GameState) => {
  const module = getModule(ctx, CubeSpawnerModule);
  const input = getModule(ctx, InputModule);
  const physics = getModule(ctx, PhysicsModule);

  const spawnCube = input.actions.get("SpawnCube") as ButtonActionState;
  if (spawnCube.pressed) {
    const cube = createPrefabEntity(ctx, "blue-cube");
    // const cube = createPrefabEntity(ctx, "mixamo-test");

    addComponent(ctx.world, Networked, cube);
    // addComponent(state.world, NetworkTransform, cube);
    addComponent(ctx.world, Owned, cube);

    mat4.getTranslation(Transform.position[cube], Transform.worldMatrix[ctx.activeCamera]);

    mat4.getRotation(cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.fromValues(0, 0, -1);
    vec3.transformQuat(direction, direction, cameraWorldQuat);
    vec3.scale(direction, direction, 10);
    RigidBody.store.get(cube)?.applyImpulse(new RAPIER.Vector3(direction[0], direction[1], direction[2]), true);

    addChild(ctx.activeScene, cube);
  }

  const pickUp = input.actions.get("PickUp") as ButtonActionState;
  if (pickUp.pressed) {
    const cameraMatrix = Transform.worldMatrix[ctx.activeCamera];

    mat4.getRotation(cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const target = vec3.fromValues(0, 0, -1);
    vec3.transformQuat(target, target, cameraWorldQuat);
    vec3.scale(target, target, 100);

    const source = mat4.getTranslation(vec3.create(), cameraMatrix);

    const s: RAPIER.Vector3 = (([x, y, z]) => ({ x, y, z }))(source);
    const t: RAPIER.Vector3 = (([x, y, z]) => ({ x, y, z }))(target);

    const ray = new RAPIER.Ray(s, t);
    const maxToi = 4.0;
    const solid = true;
    const groups = 0xfffffffff;

    const hit = physics.physicsWorld.castRay(ray, maxToi, solid, groups);
    if (hit != null) {
      // TODO: Create joint at hitPoint and attach the rigidbody to the joint, move joint around instead of object
      // const hitPoint = ray.pointAt(hit.toi); // ray.origin + ray.dir * toi
      const eid = physics.handleMap.get(hit.colliderHandle);
      console.log("Entity", eid, "hit by raycast");
    }

    // query all objects hit by the raycast
    // physics.physicsWorld.intersectionsWithRay(ray, maxToi, solid, groups, (hit) => {
    //   const hitPoint = ray.pointAt(hit.toi);
    //   console.log("Collider", hit.colliderHandle, "hit at point", hitPoint, "with normal", hit.normal);
    //   return true; // Return `false` instead if we want to stop searching for other hits.
    // });
  }

  physics.drainContactEvents((eid1?: number, eid2?: number) => {
    const playbackRate = randomRange(0.25, 0.75);
    const emitter = module.hitAudioEmitters.get(eid2!)! || module.hitAudioEmitters.get(eid1!)!;
    const source = emitter.sources[0] as RemoteAudioSource;
    playAudio(source, { playbackRate });
  });
};
