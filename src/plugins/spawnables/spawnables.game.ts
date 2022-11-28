import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, addEntity } from "bitecs";
import { mat4, vec3, quat } from "gl-matrix";
import { Vector3 } from "three";

import {
  createRemoteAudioData,
  createRemoteAudioSource,
  playAudio,
  RemoteAudioSource,
  RemoteAudioEmitter,
  createRemotePositionalAudioEmitter,
} from "../../engine/audio/audio.game";
import { getCamera } from "../../engine/camera/camera.game";
import { Transform, addChild, addTransformComponent, setEulerFromQuaternion } from "../../engine/component/transform";
import { MAX_OBJECT_CAP } from "../../engine/config.common";
import { GameState } from "../../engine/GameTypes";
import { createGLTFEntity } from "../../engine/gltf/gltf.game";
import {
  ActionDefinition,
  ActionType,
  BindingType,
  ButtonActionState,
  enableActionMap,
} from "../../engine/input/ActionMappingSystem";
import { InputModule } from "../../engine/input/input.game";
import { getInputController, InputController, inputControllerQuery } from "../../engine/input/InputController";
import { createSphereMesh } from "../../engine/mesh/mesh.game";
import { defineModule, getModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { isHost } from "../../engine/network/network.common";
import { Networked, NetworkModule, Owned, ownedNetworkedQuery } from "../../engine/network/network.game";
import { addRemoteNodeComponent } from "../../engine/node/node.game";
import { dynamicObjectCollisionGroups } from "../../engine/physics/CollisionGroups";
import { addRigidBody, PhysicsModule, RigidBody } from "../../engine/physics/physics.game";
import { createPrefabEntity, registerPrefab } from "../../engine/prefab/prefab.game";
import { addResourceRef } from "../../engine/resource/resource.game";
import { InteractableType, MaterialResource, MaterialType, RemoteMaterial } from "../../engine/resource/schema";
import { createDisposables } from "../../engine/utils/createDisposables";
import randomRange from "../../engine/utils/randomRange";
import { addInteractableComponent } from "../interaction/interaction.game";
import { ObjectCapReachedMessageType, SetObjectCapMessage, SetObjectCapMessageType } from "./spawnables.common";

const { abs, floor, random } = Math;

type SpawnablesModuleState = {
  hitAudioEmitters: Map<number, RemoteAudioEmitter>;
  actions: ActionDefinition[];
  maxObjCap: number;
};

export const SpawnablesModule = defineModule<GameState, SpawnablesModuleState>({
  name: "spawnables",
  create() {
    const actions = Array(6)
      .fill(null)
      .map((_, i) => ({
        id: `${i + 1}`,
        path: `${i + 1}`,
        type: ActionType.Button,
        bindings: [
          {
            type: BindingType.Button,
            path: `Keyboard/Digit${i + 1}`,
          },
        ],
      }));

    return {
      hitAudioEmitters: new Map(),
      actions,
      maxObjCap: MAX_OBJECT_CAP,
    };
  },
  init(ctx) {
    const module = getModule(ctx, SpawnablesModule);
    const physics = getModule(ctx, PhysicsModule);

    const crateAudioData = createRemoteAudioData(ctx, { name: "Crate Audio Data", uri: "/audio/hit.wav" });
    addResourceRef(ctx, crateAudioData.resourceId);

    registerPrefab(ctx, {
      name: "small-crate",
      create: (ctx, remote) => {
        const size = 1;
        const halfSize = size / 2;

        const eid = createGLTFEntity(ctx, "/gltf/sci_fi_crate.glb", { isStatic: false, createTrimesh: false });

        Transform.scale[eid].set([size, size, size]);

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

        const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
        const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(halfSize, halfSize, halfSize)
          .setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS)
          .setCollisionGroups(dynamicObjectCollisionGroups);

        physicsWorld.createCollider(colliderDesc, rigidBody.handle);

        addRigidBody(ctx, eid, rigidBody);

        addInteractableComponent(ctx, physics, eid, InteractableType.Grabbable);

        return eid;
      },
    });

    registerPrefab(ctx, {
      name: "medium-crate",
      create: (ctx, remote) => {
        const size = 1.75;
        const halfSize = size / 2;

        const eid = createGLTFEntity(ctx, "/gltf/sci_fi_crate.glb", { isStatic: false, createTrimesh: false });

        Transform.scale[eid].set([size, size, size]);

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

        // const rigidBodyDesc = remote
        //   ? RAPIER.RigidBodyDesc.newKinematicPositionBased()
        //   : RAPIER.RigidBodyDesc.newDynamic();
        const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();

        const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(halfSize, halfSize, halfSize)
          .setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS)
          .setCollisionGroups(dynamicObjectCollisionGroups);

        physicsWorld.createCollider(colliderDesc, rigidBody.handle);

        addRigidBody(ctx, eid, rigidBody);

        addInteractableComponent(ctx, physics, eid, InteractableType.Grabbable);

        return eid;
      },
    });

    registerPrefab(ctx, {
      name: "large-crate",
      create: (ctx, remote) => {
        const size = 2.5;
        const halfSize = size / 2;

        const eid = createGLTFEntity(ctx, "/gltf/sci_fi_crate.glb", { isStatic: false, createTrimesh: false });

        Transform.scale[eid].set([size, size, size]);

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

        // const rigidBodyDesc = remote
        //   ? RAPIER.RigidBodyDesc.newKinematicPositionBased()
        //   : RAPIER.RigidBodyDesc.newDynamic();
        const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();

        const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(halfSize, halfSize, halfSize)
          .setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS)
          .setCollisionGroups(dynamicObjectCollisionGroups);

        physicsWorld.createCollider(colliderDesc, rigidBody.handle);

        addRigidBody(ctx, eid, rigidBody);
        addInteractableComponent(ctx, physics, eid, InteractableType.Grabbable);

        return eid;
      },
    });

    const ballAudioData = createRemoteAudioData(ctx, { name: "Ball Audio Data", uri: "/audio/bounce.wav" });
    addResourceRef(ctx, ballAudioData.resourceId);

    const ballAudioData2 = createRemoteAudioData(ctx, { name: "Ball Audio Data 2", uri: "/audio/clink.wav" });
    addResourceRef(ctx, ballAudioData2.resourceId);

    const ballAudioData3 = createRemoteAudioData(ctx, { name: "Ball Audio Data 3", uri: "/audio/clink2.wav" });
    addResourceRef(ctx, ballAudioData3.resourceId);

    const emissiveMaterial = ctx.resourceManager.createResource(MaterialResource, {
      name: "Emissive Material",
      type: MaterialType.Standard,
      baseColorFactor: [0, 0.3, 1, 1],
      emissiveFactor: [0.7, 0.7, 0.7],
      metallicFactor: 0,
      roughnessFactor: 1,
    });

    addResourceRef(ctx, emissiveMaterial.resourceId);

    const mirrorMaterial = ctx.resourceManager.createResource(MaterialResource, {
      name: "Mirror Material",
      type: MaterialType.Standard,
      baseColorFactor: [1, 1, 1, 1],
      metallicFactor: 1,
      roughnessFactor: 0,
    });
    addResourceRef(ctx, mirrorMaterial.resourceId);

    const blackMirrorMaterial = ctx.resourceManager.createResource(MaterialResource, {
      name: "Black Mirror Material",
      type: MaterialType.Standard,
      baseColorFactor: [0, 0, 0, 1],
      metallicFactor: 1,
      roughnessFactor: 0,
    });
    addResourceRef(ctx, blackMirrorMaterial.resourceId);

    registerPrefab(ctx, {
      name: "mirror-ball",
      create: (ctx, remote) => {
        const eid = createBall(ctx, 1, mirrorMaterial, remote);

        const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();

        const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.ball(1 / 2)
          .setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS)
          .setCollisionGroups(dynamicObjectCollisionGroups)
          .setRestitution(1)
          .setDensity(1);

        physicsWorld.createCollider(colliderDesc, rigidBody.handle);

        addRigidBody(ctx, eid, rigidBody);
        addInteractableComponent(ctx, physics, eid, InteractableType.Grabbable);

        const audioEmitter = createRemotePositionalAudioEmitter(ctx, {
          sources: [
            createRemoteAudioSource(ctx, {
              audio: ballAudioData,
              loop: false,
              autoPlay: false,
            }),
          ],
        });

        addRemoteNodeComponent(ctx, eid, {
          audioEmitter,
        });

        module.hitAudioEmitters.set(eid, audioEmitter);

        return eid;
      },
    });

    registerPrefab(ctx, {
      name: "black-mirror-ball",
      create: (ctx, remote) => {
        const eid = createBall(ctx, 1, blackMirrorMaterial, remote);

        const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();

        const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.ball(1 / 2)
          .setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS)
          .setCollisionGroups(dynamicObjectCollisionGroups)
          .setRestitution(1)
          .setDensity(1);

        physicsWorld.createCollider(colliderDesc, rigidBody.handle);

        addRigidBody(ctx, eid, rigidBody);
        addInteractableComponent(ctx, physics, eid, InteractableType.Grabbable);

        const audioEmitter = createRemotePositionalAudioEmitter(ctx, {
          sources: [
            createRemoteAudioSource(ctx, {
              audio: ballAudioData,
              loop: false,
              autoPlay: false,
            }),
          ],
        });

        addRemoteNodeComponent(ctx, eid, {
          audioEmitter,
        });

        module.hitAudioEmitters.set(eid, audioEmitter);

        return eid;
      },
    });

    registerPrefab(ctx, {
      name: "emissive-ball",
      create: (ctx, remote) => {
        const eid = createBall(ctx, 2, emissiveMaterial, remote);

        const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();

        const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

        rigidBody.setGravityScale(0.9, true);

        const colliderDesc = RAPIER.ColliderDesc.ball(1)
          .setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS)
          .setCollisionGroups(dynamicObjectCollisionGroups)
          .setRestitution(1)
          .setDensity(0.1);

        physicsWorld.createCollider(colliderDesc, rigidBody.handle);

        addRigidBody(ctx, eid, rigidBody);
        addInteractableComponent(ctx, physics, eid, InteractableType.Grabbable);

        const hitAudioSource = createRemoteAudioSource(ctx, {
          audio: ballAudioData,
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

    // collision handlers
    const { collisionHandlers, physicsWorld } = getModule(ctx, PhysicsModule);

    collisionHandlers.push((eid1?: number, eid2?: number, handle1?: number, handle2?: number) => {
      const body1 = physicsWorld.getRigidBody(handle1!);
      const body2 = physicsWorld.getRigidBody(handle2!);

      let gain = 1;

      if (body1 && body2) {
        const linvel1 = body1.linvel();
        const linvel2 = body2.linvel();

        const manhattanLength =
          abs(linvel1.x) + abs(linvel1.y) + abs(linvel1.z) + abs(linvel2.x) + abs(linvel2.y) + abs(linvel2.z);

        gain = manhattanLength / 20;
      }

      const playbackRate = randomRange(0.3, 0.75);

      const emitter1 = module.hitAudioEmitters.get(eid1!);
      if (emitter1) {
        const source = emitter1.sources[floor(random() * emitter1.sources.length)] as RemoteAudioSource;
        playAudio(source, { playbackRate, gain });
      }

      const emitter2 = module.hitAudioEmitters.get(eid2!);
      if (emitter2) {
        const source = emitter2.sources[floor(random() * emitter2.sources.length)] as RemoteAudioSource;
        playAudio(source, { playbackRate, gain });
      }
    });

    // action mapping
    const { actions } = module;

    // id determines which prefab is spawned in the system
    actions[0].id = "small-crate";
    actions[1].id = "medium-crate";
    actions[2].id = "large-crate";
    actions[3].id = "mirror-ball";
    actions[4].id = "black-mirror-ball";
    actions[5].id = "emissive-ball";

    const input = getModule(ctx, InputModule);
    const controller = input.defaultController;
    enableActionMap(controller, {
      id: "spawnables",
      actions,
    });

    return createDisposables([registerMessageHandler(ctx, SetObjectCapMessageType, onSetObjectCap)]);
  },
});

function onSetObjectCap(ctx: GameState, message: SetObjectCapMessage) {
  const module = getModule(ctx, SpawnablesModule);
  module.maxObjCap = message.value;
}

const THROW_FORCE = 10;

const _direction = vec3.create();
const _impulse = new Vector3();
const _cameraWorldQuat = quat.create();

export const SpawnableSystem = (ctx: GameState) => {
  const network = getModule(ctx, NetworkModule);
  if (network.authoritative && !isHost(network)) {
    return;
  }

  const input = getModule(ctx, InputModule);
  const spawnablesModule = getModule(ctx, SpawnablesModule);

  const rigs = inputControllerQuery(ctx.world);

  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const camera = getCamera(ctx, eid);
    const controller = getInputController(input, eid);
    updateSpawnables(ctx, spawnablesModule, controller, camera);
  }
};

export const updateSpawnables = (
  ctx: GameState,
  { actions, maxObjCap }: SpawnablesModuleState,
  controller: InputController,
  camera: number
) => {
  const pressedActions = actions.filter((a) => (controller.actions.get(a.path) as ButtonActionState)?.pressed);

  if (pressedActions.length) {
    // bounce out of the system if we hit the max object cap
    const ownedEnts = ownedNetworkedQuery(ctx.world);
    if (ownedEnts.length > maxObjCap) {
      ctx.sendMessage(Thread.Main, {
        type: ObjectCapReachedMessageType,
      });
      // TODO: send this message to the other clients
      // TODO: add two configs: max objects per client and max objects per room
      return;
    }
  }

  for (const action of pressedActions) {
    const eid = createPrefabEntity(ctx, action.id);

    // caveat: must add owned before networked (should maybe change Owned to Remote)
    addComponent(ctx.world, Owned, eid);
    // Networked component isn't reset when removed so reset on add
    addComponent(ctx.world, Networked, eid, true);

    mat4.getTranslation(Transform.position[eid], Transform.worldMatrix[camera]);

    mat4.getRotation(_cameraWorldQuat, Transform.worldMatrix[camera]);
    const direction = vec3.set(_direction, 0, 0, -1);
    vec3.transformQuat(direction, direction, _cameraWorldQuat);

    // place object at direction
    vec3.add(Transform.position[eid], Transform.position[eid], direction);

    vec3.scale(direction, direction, THROW_FORCE);

    _impulse.fromArray(direction);

    const body = RigidBody.store.get(eid);

    if (!body) {
      console.warn("could not find RigidBody for spawned entity " + eid);
      continue;
    }

    setEulerFromQuaternion(Transform.rotation[eid], _cameraWorldQuat);

    body.applyImpulse(_impulse, true);

    addChild(ctx.activeScene, eid);
  }
};

export const createBall = (state: GameState, size: number, material?: RemoteMaterial, remote = false) => {
  const { world } = state;
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  const mesh = createSphereMesh(state, size, material);

  addRemoteNodeComponent(state, eid, { mesh });

  return eid;
};
