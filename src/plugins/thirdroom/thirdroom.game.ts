import { addComponent, addEntity, defineQuery, hasComponent, removeComponent } from "bitecs";
import { vec3 } from "gl-matrix";
import RAPIER from "@dimforge/rapier3d-compat";

import { SpawnPoint } from "../../engine/component/SpawnPoint";
import {
  addChild,
  addTransformComponent,
  removeRecursive,
  setEulerFromQuaternion,
  Transform,
} from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import {
  associatePeerWithEntity,
  GameNetworkState,
  Networked,
  NetworkModule,
  Owned,
} from "../../engine/network/network.game";
import { createPlayerRig } from "../PhysicsCharacterController";
import {
  EnterWorldMessage,
  WorldLoadedMessage,
  WorldLoadErrorMessage,
  ExitWorldMessage,
  LoadWorldMessage,
  PrintThreadStateMessage,
  ThirdRoomMessageType,
  GLTFViewerLoadGLTFMessage,
  ExitedWorldMessage,
  GLTFViewerLoadErrorMessage,
  GLTFViewerLoadedMessage,
} from "./thirdroom.common";
import { createRemoteImage } from "../../engine/image/image.game";
import { createRemoteTexture } from "../../engine/texture/texture.game";
import { RemoteSceneComponent } from "../../engine/scene/scene.game";
import { createRemoteSampler } from "../../engine/sampler/sampler.game";
import { SamplerMapping } from "../../engine/sampler/sampler.common";
import { disposeGLTFResource, GLTFResource, inflateGLTFScene } from "../../engine/gltf/gltf.game";
import { NOOP } from "../../engine/config.common";
import { addRemoteNodeComponent } from "../../engine/node/node.game";
import { createRemotePerspectiveCamera } from "../../engine/camera/camera.game";
import { registerPrefab } from "../../engine/prefab/prefab.game";
import { CharacterControllerType, SceneCharacterControllerComponent } from "../../engine/gltf/MX_character_controller";
import { createFlyPlayerRig, FlyRig } from "../FlyCharacterController";
import { createContainerizedAvatar } from "../avatar";
import { createReflectionProbeResource } from "../../engine/reflection-probe/reflection-probe.game";
import { addRigidBody, PhysicsModule, RigidBody } from "../../engine/physics/physics.game";
import { waitForCurrentSceneToRender } from "../../engine/renderer/renderer.game";
import { waitUntil } from "../../engine/utils/waitUntil";
import { boundsCheckCollisionGroups, playerCollisionGroups } from "../../engine/physics/CollisionGroups";
import { Player } from "../../engine/component/Player";
import {
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
  enableActionMap,
} from "../../engine/input/ActionMappingSystem";
import { GameInputModule, getInputController, InputModule, addInputController } from "../../engine/input/input.game";
import { spawnEntity } from "../../engine/utils/spawnEntity";
import { AddPeerIdMessage, isHost, NetworkMessageType } from "../../engine/network/network.common";
import {
  createRemotePositionalAudioEmitter,
  createRemoteMediaStreamSource,
  createRemoteMediaStream,
} from "../../engine/audio/audio.game";
import { createRemoteNametag } from "../../engine/nametag/nametag.game";
import { CharacterRig } from "../rigs/character.game";
import { createInputController, InputController, inputControllerQuery } from "../../engine/input/InputController";

interface ThirdRoomModuleState {
  sceneGLTF?: GLTFResource;
  collisionsGLTF?: GLTFResource;
}

export const ThirdRoomModule = defineModule<GameState, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {};
  },
  async init(ctx) {
    const disposables = [
      registerMessageHandler(ctx, ThirdRoomMessageType.LoadWorld, onLoadWorld),
      registerMessageHandler(ctx, ThirdRoomMessageType.EnterWorld, onEnterWorld),
      registerMessageHandler(ctx, ThirdRoomMessageType.ExitWorld, onExitWorld),
      registerMessageHandler(ctx, NetworkMessageType.AddPeerId, onAddPeerId),
      registerMessageHandler(ctx, ThirdRoomMessageType.PrintThreadState, onPrintThreadState),
      registerMessageHandler(ctx, ThirdRoomMessageType.GLTFViewerLoadGLTF, onGLTFViewerLoadGLTF),
    ];

    registerPrefab(ctx, {
      name: "mixamo-x",
      create: (ctx, remote) => {
        return createContainerizedAvatar(ctx, "/gltf/full-animation-rig.glb", { remote });
      },
    });

    registerPrefab(ctx, {
      name: "mixamo-y",
      create: (ctx, remote) => {
        return createContainerizedAvatar(ctx, "/gltf/full-animation-rig.glb", { remote });
      },
    });

    // create out of bounds floor check
    const { collisionHandlers, physicsWorld } = getModule(ctx, PhysicsModule);
    const rigidBody = physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.newStatic());
    const size = 10000;
    const colliderDesc = RAPIER.ColliderDesc.cuboid(size, 50, size)
      .setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS)
      .setCollisionGroups(boundsCheckCollisionGroups);
    physicsWorld.createCollider(colliderDesc, rigidBody.handle);

    rigidBody.setTranslation(new RAPIER.Vector3(size / 2, -150, size / 2), true);

    collisionHandlers.push((eid1?: number, eid2?: number, handle1?: number, handle2?: number) => {
      const entity = eid1 || eid2;

      if (!entity) return;

      if (hasComponent(ctx.world, Networked, entity) && !hasComponent(ctx.world, Owned, entity)) return;

      const floor = handle1 === rigidBody.handle || handle2 === rigidBody.handle;

      if (entity && floor) {
        if (
          hasComponent(ctx.world, Networked, entity) &&
          hasComponent(ctx.world, Owned, entity) &&
          !hasComponent(ctx.world, Player, entity)
        ) {
          removeRecursive(ctx.world, entity);
        } else if (hasComponent(ctx.world, Player, entity)) {
          spawnEntity(ctx, spawnPointQuery(ctx.world), entity);
        }
      }
    });

    const input = getModule(ctx, InputModule);
    const controller = input.defaultController;
    enableActionMap(controller, actionMap);

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

const actionMap: ActionMap = {
  id: "fly-mode-toggle",
  actions: [
    {
      id: "toggleFlyMode",
      path: "toggleFlyMode",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyB",
        },
      ],
    },
  ],
};

async function onLoadWorld(ctx: GameState, message: LoadWorldMessage) {
  try {
    await loadEnvironment(ctx, message.url);

    loadPreviewCamera(ctx);

    await waitForCurrentSceneToRender(ctx);

    ctx.sendMessage<WorldLoadedMessage>(Thread.Main, {
      type: ThirdRoomMessageType.WorldLoaded,
      id: message.id,
      url: message.url,
    });
  } catch (error: any) {
    console.error(error);

    ctx.sendMessage<WorldLoadErrorMessage>(Thread.Main, {
      type: ThirdRoomMessageType.WorldLoadError,
      id: message.id,
      url: message.url,
      error: error.message || "Unknown error",
    });
  }
}

// when peers join us in the world
function onAddPeerId(ctx: GameState, message: AddPeerIdMessage) {
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);
  if (!isHost(network)) {
    return;
  }

  loadRemotePlayerRig(ctx, input, network, message.peerId);
}

// when we join the world
async function onEnterWorld(ctx: GameState, message: EnterWorldMessage) {
  const network = getModule(ctx, NetworkModule);
  const input = getModule(ctx, InputModule);
  await waitUntil(() => network.peerIdToIndex.has(network.peerId));

  if (isHost(network)) {
    loadPlayerRig(ctx, input, network);
  }
}

function onExitWorld(ctx: GameState, message: ExitWorldMessage) {
  const thirdroom = getModule(ctx, ThirdRoomModule);

  ctx.sendMessage<ExitedWorldMessage>(Thread.Main, {
    type: ThirdRoomMessageType.ExitedWorld,
  });

  removeRecursive(ctx.world, ctx.activeScene);

  if (thirdroom.sceneGLTF) {
    disposeGLTFResource(thirdroom.sceneGLTF);
    thirdroom.sceneGLTF = undefined;
  }

  if (thirdroom.collisionsGLTF) {
    disposeGLTFResource(thirdroom.collisionsGLTF);
    thirdroom.collisionsGLTF = undefined;
  }

  ctx.activeCamera = NOOP;
  ctx.activeScene = NOOP;
}

function onPrintThreadState(ctx: GameState, message: PrintThreadStateMessage) {
  console.log(Thread.Game, ctx);
}

async function onGLTFViewerLoadGLTF(ctx: GameState, message: GLTFViewerLoadGLTFMessage) {
  try {
    const network = getModule(ctx, NetworkModule);
    const input = getModule(ctx, InputModule);

    await loadEnvironment(ctx, message.url, message.fileMap);

    loadPlayerRig(ctx, input, network);

    ctx.sendMessage<GLTFViewerLoadedMessage>(Thread.Main, {
      type: ThirdRoomMessageType.GLTFViewerLoaded,
      url: message.url,
    });
  } catch (error: any) {
    console.error(error);

    ctx.sendMessage<GLTFViewerLoadErrorMessage>(Thread.Main, {
      type: ThirdRoomMessageType.GLTFViewerLoadError,
      error: error.message || "Unknown Error",
    });

    URL.revokeObjectURL(message.url);

    for (const objectUrl of message.fileMap.values()) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

async function loadEnvironment(ctx: GameState, url: string, fileMap?: Map<string, string>) {
  const thirdroom = getModule(ctx, ThirdRoomModule);

  if (ctx.activeScene) {
    removeRecursive(ctx.world, ctx.activeScene);

    if (thirdroom.sceneGLTF) {
      disposeGLTFResource(thirdroom.sceneGLTF);
      thirdroom.sceneGLTF = undefined;
    }

    if (thirdroom.collisionsGLTF) {
      disposeGLTFResource(thirdroom.collisionsGLTF);
      thirdroom.collisionsGLTF = undefined;
    }

    ctx.activeScene = NOOP;
    ctx.activeCamera = NOOP;
  }

  const newScene = addEntity(ctx.world);

  const sceneGltf = await inflateGLTFScene(ctx, newScene, url, { fileMap, isStatic: true });

  thirdroom.sceneGLTF = sceneGltf;

  const newSceneResource = RemoteSceneComponent.get(newScene)!;

  if (!newSceneResource.reflectionProbe || !newSceneResource.backgroundTexture) {
    const defaultEnvironmentMapTexture = createRemoteTexture(ctx, {
      name: "Environment Map Texture",
      image: createRemoteImage(ctx, {
        name: "Environment Map Image",
        uri: "/cubemap/clouds_2k.hdr",
        flipY: true,
      }),
      sampler: createRemoteSampler(ctx, {
        mapping: SamplerMapping.EquirectangularReflectionMapping,
      }),
    });

    if (!newSceneResource.reflectionProbe) {
      newSceneResource.reflectionProbe = createReflectionProbeResource(ctx, {
        reflectionProbeTexture: defaultEnvironmentMapTexture,
      });
    }

    if (!newSceneResource.backgroundTexture) {
      newSceneResource.backgroundTexture = defaultEnvironmentMapTexture;
    }
  }

  ctx.activeScene = newScene;

  // Temp hack for city scene
  if (
    sceneGltf.root.scenes &&
    sceneGltf.root.scenes.length > 0 &&
    sceneGltf.root.scenes[0].name === "SampleSceneDay 1"
  ) {
    const collisionGeo = addEntity(ctx.world);
    thirdroom.collisionsGLTF = await inflateGLTFScene(ctx, collisionGeo, "/gltf/city/CityCollisions.glb", {
      isStatic: true,
    });
    addChild(newScene, collisionGeo);
  }
}

export const spawnPointQuery = defineQuery([SpawnPoint]);

function loadPreviewCamera(ctx: GameState) {
  const spawnPoints = spawnPointQuery(ctx.world);

  let defaultCamera = NOOP;

  if (!ctx.activeCamera) {
    defaultCamera = addEntity(ctx.world);

    addTransformComponent(ctx.world, defaultCamera);

    addChild(ctx.activeScene, defaultCamera);

    addRemoteNodeComponent(ctx, defaultCamera, {
      camera: createRemotePerspectiveCamera(ctx),
    });

    ctx.activeCamera = defaultCamera;
  }

  if (ctx.activeCamera === defaultCamera && spawnPoints.length > 0) {
    vec3.copy(Transform.position[defaultCamera], Transform.position[spawnPoints[0]]);
    Transform.position[defaultCamera][1] += 1.6;
    vec3.copy(Transform.quaternion[defaultCamera], Transform.quaternion[spawnPoints[0]]);
    setEulerFromQuaternion(Transform.rotation[defaultCamera], Transform.quaternion[defaultCamera]);
  }
}

function loadPlayerRig(ctx: GameState, input: GameInputModule, network: GameNetworkState) {
  const spawnPoints = spawnPointQuery(ctx.world);

  if (ctx.activeCamera) {
    removeRecursive(ctx.world, ctx.activeCamera);
  }

  const characterControllerType = SceneCharacterControllerComponent.get(ctx.activeScene)?.type;

  let eid: number;

  const prefab = Math.random() > 0.5 ? "mixamo-x" : "mixamo-y";

  if (characterControllerType === CharacterControllerType.Fly || spawnPoints.length === 0) {
    eid = createFlyPlayerRig(ctx, prefab, true);
  } else {
    eid = createPlayerRig(ctx, prefab, true);
  }

  associatePeerWithEntity(network, network.peerId, eid);

  // caveat: if owned added after player, this local player entity is added to enteredRemotePlayerQuery
  addComponent(ctx.world, Owned, eid);
  addComponent(ctx.world, Player, eid);
  // Networked component isn't reset when removed so reset on add
  addComponent(ctx.world, Networked, eid, true);

  // setup input controller from default controller's ringbuffer and actionMaps
  const defaultController = input.defaultController;
  const controller = createInputController(defaultController);
  addInputController(ctx.world, input, controller, eid);

  input.activeController = controller;

  addChild(ctx.activeScene, eid);

  if (spawnPoints.length > 0) {
    spawnEntity(ctx, spawnPoints, eid);
  }

  return eid;
}

function loadRemotePlayerRig(ctx: GameState, input: GameInputModule, network: GameNetworkState, peerId: string) {
  const spawnPoints = spawnPointQuery(ctx.world);

  const characterControllerType = SceneCharacterControllerComponent.get(ctx.activeScene)?.type;

  let eid: number;

  const prefab = Math.random() > 0.5 ? "mixamo-x" : "mixamo-y";

  if (characterControllerType === CharacterControllerType.Fly || spawnPoints.length === 0) {
    eid = createFlyPlayerRig(ctx, prefab, false);
  } else {
    eid = createPlayerRig(ctx, prefab, false);
  }

  associatePeerWithEntity(network, peerId, eid);

  // caveat: if owned added after player, this local player entity is added to enteredRemotePlayerQuery
  addComponent(ctx.world, Owned, eid);
  addComponent(ctx.world, Player, eid);
  // Networked component isn't reset when removed so reset on add
  addComponent(ctx.world, Networked, eid, true);

  // setup remote node data
  addRemoteNodeComponent(ctx, eid, {
    name: peerId,
    audioEmitter: createRemotePositionalAudioEmitter(ctx, {
      sources: [
        createRemoteMediaStreamSource(ctx, {
          stream: createRemoteMediaStream(ctx, { streamId: peerId }),
        }),
      ],
    }),
    nametag: createRemoteNametag(ctx, {
      name: peerId,
    }),
  });

  // setup input controller from default controller using just the actionMaps
  const defaultController = input.defaultController;
  const controller = createInputController({
    actionMaps: defaultController.actionMaps,
  });
  addInputController(input, controller, eid);

  addChild(ctx.activeScene, eid);

  if (spawnPoints.length > 0) {
    spawnEntity(ctx, spawnPoints, eid);
  }

  return eid;
}

function swapToFlyPlayerRig(ctx: GameState, playerRig: number) {
  removeComponent(ctx.world, CharacterRig, playerRig);
  removeComponent(ctx.world, RigidBody, playerRig);

  addComponent(ctx.world, FlyRig, playerRig);
  FlyRig.set(playerRig, { speed: 10 });
}

function swapToPlayerRig(ctx: GameState, playerRig: number) {
  removeComponent(ctx.world, FlyRig, playerRig);

  addComponent(ctx.world, CharacterRig, playerRig);

  const { physicsWorld } = getModule(ctx, PhysicsModule);

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.5);
  colliderDesc.setCollisionGroups(playerCollisionGroups);

  physicsWorld.createCollider(colliderDesc, rigidBody.handle);
  addRigidBody(ctx, playerRig, rigidBody);
}

export function ThirdroomSystem(ctx: GameState) {
  const input = getModule(ctx, InputModule);

  const rigs = inputControllerQuery(ctx.world);
  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const controller = getInputController(input, eid);
    updateThirdroom(ctx, controller, eid);
  }
}

function updateThirdroom(ctx: GameState, controller: InputController, player: number) {
  const toggleFlyMode = controller.actions.get("toggleFlyMode") as ButtonActionState;
  if (toggleFlyMode.pressed) {
    if (hasComponent(ctx.world, FlyRig, player)) {
      swapToPlayerRig(ctx, player);
    } else {
      swapToFlyPlayerRig(ctx, player);
    }
  }
}
