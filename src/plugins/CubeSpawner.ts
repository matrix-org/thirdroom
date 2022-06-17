import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent } from "bitecs";
import { mat4, vec3, quat } from "gl-matrix";

import {
  createRemoteAudioData,
  createRemoteAudioSource,
  // createRemoteGlobalAudioEmitter,
  createRemotePositionalAudioEmitter,
  createRemotePositionalAudioEmitter,
  playAudio,
  RemoteAudioEmitter,
  RemoteAudioSource,
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
// import { addRemoteNodeComponent, RemoteNodeComponent } from "../engine/node/node.game";
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
    const hitAudioSource = createRemoteAudioSource(ctx, {
      audio: hitAudioData,
      loop: false,
    });

    registerPrefab(ctx, {
      name: "blue-cube",
      create: () => {
        const eid = createCube(ctx, cubeMaterial);

        const audioEmitter = createRemotePositionalAudioEmitter(ctx, {
          // const audioEmitter = createRemoteGlobalAudioEmitter(ctx, {
          sources: [hitAudioSource],
        });

        // addRemoteNodeComponent(ctx, eid, {
        //   audioEmitter,
        // });

        module.hitAudioEmitters.set(eid, audioEmitter);

        return eid;
      },
    });

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
  ],
};

const worldQuat = quat.create();
export const CubeSpawnerSystem = (ctx: GameState) => {
  const module = getModule(ctx, CubeSpawnerModule);
  const input = getModule(ctx, InputModule);
  const physics = getModule(ctx, PhysicsModule);

  const spawnCube = input.actions.get("SpawnCube") as ButtonActionState;
  if (spawnCube.pressed) {
    const cube = createPrefabEntity(ctx, "blue-cube");

    addComponent(ctx.world, Networked, cube);
    // addComponent(state.world, NetworkTransform, cube);
    addComponent(ctx.world, Owned, cube);

    mat4.getTranslation(Transform.position[cube], Transform.worldMatrix[ctx.activeCamera]);

    mat4.getRotation(worldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(vec3.create(), 0, 0, -1);
    vec3.transformQuat(direction, direction, worldQuat);
    vec3.scale(direction, direction, 10);
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
