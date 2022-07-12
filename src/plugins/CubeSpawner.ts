import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, addEntity } from "bitecs";
import { mat4, vec3, quat } from "gl-matrix";

import {
  createRemoteAudioData,
  createRemoteAudioSource,
  playAudio,
  RemoteAudioSource,
  RemoteAudioEmitter,
  createRemotePositionalAudioEmitter,
} from "../engine/audio/audio.game";
import { Transform, addChild, addTransformComponent } from "../engine/component/transform";
import { GameState } from "../engine/GameTypes";
import { createRemoteImage } from "../engine/image/image.game";
import {
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
  enableActionMap,
} from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { createRemoteStandardMaterial, RemoteMaterial } from "../engine/material/material.game";
import { defineModule, getModule } from "../engine/module/module.common";
import { Networked, Owned } from "../engine/network/network.game";
import { addRemoteNodeComponent } from "../engine/node/node.game";
import { addRigidBody, PhysicsModule, RigidBody } from "../engine/physics/physics.game";
import { createCube, createPrefabEntity, createSphereMesh, registerPrefab } from "../engine/prefab";
import { addResourceRef } from "../engine/resource/resource.game";
import { createRemoteTexture } from "../engine/texture/texture.game";
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

    const image = createRemoteImage(ctx, { name: "Crate Image", uri: "/image/crate.gif" });
    addResourceRef(ctx, image.resourceId);
    const texture = createRemoteTexture(ctx, { name: "Crate Texture", image });
    addResourceRef(ctx, texture.resourceId);

    const cubeMaterial = createRemoteStandardMaterial(ctx, {
      name: "Cube Material",
      baseColorTexture: texture,
    });
    addResourceRef(ctx, cubeMaterial.resourceId);

    const crateAudioData = createRemoteAudioData(ctx, { name: "Crate Audio Data", uri: "/audio/hit.wav" });
    addResourceRef(ctx, crateAudioData.resourceId);

    registerPrefab(ctx, {
      name: "crate",
      create: () => {
        const eid = createCube(ctx, 1, cubeMaterial);

        const hitAudioSource = createRemoteAudioSource(ctx, {
          audio: crateAudioData,
          loop: false,
          autoPlay: false,
        });

        const audioEmitter = createRemotePositionalAudioEmitter(ctx, {
          sources: [hitAudioSource],
        });

        addRemoteNodeComponent(ctx, eid, {
          audioEmitter,
        });

        module.hitAudioEmitters.set(eid, audioEmitter);

        return eid;
      },
    });

    const ballAudioData = createRemoteAudioData(ctx, { name: "Ball Audio Data", uri: "/audio/bounce.wav" });
    addResourceRef(ctx, ballAudioData.resourceId);

    const ballMaterial = createRemoteStandardMaterial(ctx, {
      name: "Ball Material",
      baseColorTexture: texture,
      baseColorFactor: [0.9, 0.5, 0.5, 1],
      occlusionTexture: texture,
      emissiveTexture: texture,
      metallicRoughnessTexture: texture,
    });
    addResourceRef(ctx, ballMaterial.resourceId);

    registerPrefab(ctx, {
      name: "bouncy-ball",
      create: () => {
        const eid = createBouncyBall(ctx, 1, ballMaterial);

        const hitAudioSource = createRemoteAudioSource(ctx, {
          audio: ballAudioData,
          loop: false,
          autoPlay: false,
          // TODO: this doesn't work
          gain: 0,
        });

        const audioEmitter = createRemotePositionalAudioEmitter(ctx, {
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
          path: "Keyboard/Digit1",
        },
      ],
    },
    {
      id: "spawnBall",
      path: "SpawnBall",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/Digit2",
        },
      ],
    },
  ],
};

const CUBE_THROW_FORCE = 10;

const _direction = vec3.create();

const _impulse = new RAPIER.Vector3(0, 0, 0);

const cameraWorldQuat = quat.create();
export const CubeSpawnerSystem = (ctx: GameState) => {
  const module = getModule(ctx, CubeSpawnerModule);
  const input = getModule(ctx, InputModule);
  const physics = getModule(ctx, PhysicsModule);

  const spawnCube = input.actions.get("SpawnCube") as ButtonActionState;
  const spawnBall = input.actions.get("SpawnBall") as ButtonActionState;

  const prefab = spawnCube.pressed ? "crate" : spawnBall.pressed ? "bouncy-ball" : "crate";

  if (spawnCube.pressed || spawnBall.pressed) {
    const cube = createPrefabEntity(ctx, prefab);

    // caveat: must add owned before networked (should maybe change Owned to Remote)
    addComponent(ctx.world, Owned, cube);
    addComponent(ctx.world, Networked, cube);

    mat4.getTranslation(Transform.position[cube], Transform.worldMatrix[ctx.activeCamera]);

    mat4.getRotation(cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(_direction, 0, 0, -1);
    vec3.transformQuat(direction, direction, cameraWorldQuat);
    vec3.scale(direction, direction, CUBE_THROW_FORCE);

    _impulse.x = direction[0];
    _impulse.y = direction[1];
    _impulse.z = direction[2];
    RigidBody.store.get(cube)?.applyImpulse(_impulse, true);

    addChild(ctx.activeScene, cube);
  }

  physics.drainContactEvents((eid1?: number, eid2?: number, handle1?: number, handle2?: number) => {
    const body1 = physics.physicsWorld.getRigidBody(handle1!);
    const body2 = physics.physicsWorld.getRigidBody(handle2!);

    let gain = 1;

    if (body1 && body2) {
      const linvel1 = body1.linvel();
      const linvel2 = body2.linvel();

      const x =
        Math.abs(linvel1.x) +
        Math.abs(linvel1.y) +
        Math.abs(linvel1.z) +
        Math.abs(linvel2.x) +
        Math.abs(linvel2.y) +
        Math.abs(linvel2.z);

      gain = x / 20;
    }

    const playbackRate = randomRange(0.3, 0.75);
    const emitter = module.hitAudioEmitters.get(eid2!)! || module.hitAudioEmitters.get(eid1!)!;
    const source = emitter.sources[0] as RemoteAudioSource;
    playAudio(source, { playbackRate, gain });
  });
};

export const createBouncyBall = (state: GameState, size: number, material?: RemoteMaterial) => {
  const { world } = state;
  const { physicsWorld } = getModule(state, PhysicsModule);
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  const mesh = createSphereMesh(state, 1, material);

  addRemoteNodeComponent(state, eid, { mesh });

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.ball(size / 2)
    .setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS)
    .setCollisionGroups(0xffff_ffff)
    .setSolverGroups(0xffff_ffff)
    .setRestitution(1.3)
    .setDensity(1);

  physicsWorld.createCollider(colliderDesc, rigidBody.handle);

  addRigidBody(world, eid, rigidBody);

  return eid;
};
