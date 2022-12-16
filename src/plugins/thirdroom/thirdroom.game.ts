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
import { RemoteSceneComponent } from "../../engine/scene/scene.game";
import { disposeGLTFResource, GLTFResource, inflateGLTFScene } from "../../engine/gltf/gltf.game";
import { NOOP } from "../../engine/config.common";
import { addRemoteNodeComponent } from "../../engine/node/node.game";
import { createCamera, createRemotePerspectiveCamera } from "../../engine/camera/camera.game";
import { createPrefabEntity, registerPrefab } from "../../engine/prefab/prefab.game";
import { CharacterControllerType, SceneCharacterControllerComponent } from "../../engine/gltf/MX_character_controller";
import { addFlyControls, FlyControls } from "../FlyCharacterController";
import { addPhysicsControls, PhysicsControls } from "../PhysicsCharacterController";
import { addAvatar } from "../avatars/avatar.game";
import { createReflectionProbeResource } from "../../engine/reflection-probe/reflection-probe.game";
import { PhysicsModule, PhysicsModuleState, RigidBody } from "../../engine/physics/physics.game";
import { waitForCurrentSceneToRender } from "../../engine/renderer/renderer.game";
import { boundsCheckCollisionGroups } from "../../engine/physics/CollisionGroups";
import { OurPlayer, Player } from "../../engine/component/Player";
import {
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
  enableActionMap,
} from "../../engine/input/ActionMappingSystem";
import { GameInputModule, InputModule } from "../../engine/input/input.game";
import { spawnEntity } from "../../engine/utils/spawnEntity";
import { AddPeerIdMessage, isHost, NetworkMessageType } from "../../engine/network/network.common";
import {
  createRemotePositionalAudioEmitter,
  createRemoteMediaStreamSource,
  createRemoteMediaStream,
} from "../../engine/audio/audio.game";
import {
  addInputController,
  createInputController,
  getInputController,
  InputController,
  inputControllerQuery,
} from "../../engine/input/InputController";
import { addCameraPitchTargetComponent, addCameraYawTargetComponent } from "../FirstPersonCamera";
import { addInteractableComponent, removeInteractableComponent } from "../interaction/interaction.game";
import { embodyAvatar } from "../../engine/network/serialization.game";
import {
  addScriptComponent,
  loadJSScript,
  loadWASMScript,
  Script,
  ScriptExecutionEnvironment,
} from "../../engine/scripting/scripting.game";
import {
  ImageResource,
  InteractableType,
  SamplerMapping,
  SamplerResource,
  TextureResource,
} from "../../engine/resource/schema";
import * as Schema from "../../engine/resource/schema";
import { ResourceDefinition } from "../../engine/resource/ResourceDefinition";
import { addAvatarRigidBody } from "../avatars/addAvatarRigidBody";

interface ThirdRoomModuleState {
  sceneGLTF?: GLTFResource;
  collisionsGLTF?: GLTFResource;
}

const addAvatarCamera = (ctx: GameState, eid: number) => {
  const camera = createCamera(ctx);
  Transform.position[camera][1] = 1.2;
  addChild(eid, camera);
  addCameraYawTargetComponent(ctx.world, eid);
  addCameraPitchTargetComponent(ctx.world, camera);
  return camera;
};

const addAvatarController = (ctx: GameState, input: GameInputModule, eid: number) => {
  const defaultController = input.defaultController;
  const controller = createInputController({
    actionMaps: defaultController.actionMaps,
  });
  addInputController(ctx.world, input, controller, eid);
  return controller;
};

const createAvatarRig =
  (input: GameInputModule, physics: PhysicsModuleState, network: GameNetworkState) =>
  (ctx: GameState, remote = false) => {
    const spawnPoints = spawnPointQuery(ctx.world);

    const eid = addEntity(ctx.world);
    addTransformComponent(ctx.world, eid);
    addAvatarCamera(ctx, eid);
    addAvatarController(ctx, input, eid);

    const characterControllerType = SceneCharacterControllerComponent.get(ctx.activeScene)?.type;
    if (characterControllerType === CharacterControllerType.Fly || spawnPoints.length === 0) {
      addFlyControls(ctx, eid);
    } else {
      addPhysicsControls(ctx, eid);
    }

    addAvatar(ctx, physics, "/gltf/full-animation-rig.glb", eid, {
      nametag: true,
    });

    addAvatarRigidBody(ctx, physics, eid);
    addInteractableComponent(ctx, physics, eid, InteractableType.Player);

    return eid;
  };

export const ThirdRoomModule = defineModule<GameState, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {};
  },
  async init(ctx) {
    const input = getModule(ctx, InputModule);
    const physics = getModule(ctx, PhysicsModule);
    const network = getModule(ctx, NetworkModule);

    const disposables = [
      registerMessageHandler(ctx, ThirdRoomMessageType.LoadWorld, onLoadWorld),
      registerMessageHandler(ctx, ThirdRoomMessageType.EnterWorld, onEnterWorld),
      registerMessageHandler(ctx, ThirdRoomMessageType.ExitWorld, onExitWorld),
      registerMessageHandler(ctx, NetworkMessageType.AddPeerId, onAddPeerId),
      registerMessageHandler(ctx, ThirdRoomMessageType.PrintThreadState, onPrintThreadState),
      registerMessageHandler(ctx, ThirdRoomMessageType.GLTFViewerLoadGLTF, onGLTFViewerLoadGLTF),
    ];

    registerPrefab(ctx, {
      name: "avatar",
      create: createAvatarRig(input, physics, network),
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

    enableActionMap(input.defaultController, actionMap);

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
    await loadEnvironment(ctx, message.url, message.scriptUrl);

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
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);
  if (network.authoritative && isHost(network)) {
    loadRemotePlayerRig(ctx, physics, input, network, message.peerId);
  }
}

// when we join the world
async function onEnterWorld(ctx: GameState, message: EnterWorldMessage) {
  const network = getModule(ctx, NetworkModule);
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);

  loadPlayerRig(ctx, physics, input, network);
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
    const physics = getModule(ctx, PhysicsModule);
    const input = getModule(ctx, InputModule);

    await loadEnvironment(ctx, message.url, message.scriptUrl, message.fileMap);

    loadPlayerRig(ctx, physics, input, network);

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

async function loadEnvironment(ctx: GameState, url: string, scriptUrl?: string, fileMap?: Map<string, string>) {
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

  let script: Script<ScriptExecutionEnvironment> | undefined;

  if (scriptUrl) {
    const allowedResources = Object.values(Schema).filter((val) => "schema" in val) as ResourceDefinition[];
    const response = await fetch(scriptUrl);

    const contentType = response.headers.get("content-type");

    if (contentType) {
      if (
        contentType === "application/javascript" ||
        contentType === "application/x-javascript" ||
        contentType.startsWith("text/javascript")
      ) {
        const scriptSource = await response.text();
        script = await loadJSScript(ctx, scriptSource, allowedResources);
      } else if (contentType === "application/wasm") {
        const scriptBuffer = await response.arrayBuffer();
        script = await loadWASMScript(ctx, scriptBuffer, allowedResources);
      }
    }

    if (script) {
      addScriptComponent(ctx, newScene, script);
    }
  }

  const sceneGltf = await inflateGLTFScene(ctx, newScene, url, {
    fileMap,
    isStatic: true,
    resourceManager: script?.resourceManager,
  });

  thirdroom.sceneGLTF = sceneGltf;

  const newSceneResource = RemoteSceneComponent.get(newScene)!;

  const resourceManager = script?.resourceManager || ctx.resourceManager;

  if (!newSceneResource.reflectionProbe || !newSceneResource.backgroundTexture) {
    const defaultEnvironmentMapTexture = ctx.resourceManager.createResource(TextureResource, {
      name: "Environment Map Texture",
      source: ctx.resourceManager.createResource(ImageResource, {
        name: "Environment Map Image",
        uri: "/cubemap/clouds_2k.hdr",
        flipY: true,
      }),
      sampler: resourceManager.createResource(SamplerResource, {
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

  if (script) {
    script.ready = true;
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

function loadPlayerRig(ctx: GameState, physics: PhysicsModuleState, input: GameInputModule, network: GameNetworkState) {
  if (ctx.activeCamera) {
    removeRecursive(ctx.world, ctx.activeCamera);
  }

  const eid = createPrefabEntity(ctx, "avatar");
  embodyAvatar(ctx, physics, input, eid);

  associatePeerWithEntity(network, network.peerId, eid);

  // caveat: if owned added after player, this local player entity is added to enteredRemotePlayerQuery
  // TODO: add Authoring component for authoritatively controlled entities as a host,
  //       use Owned to distinguish actual ownership on all clients
  addComponent(ctx.world, Owned, eid);
  addComponent(ctx.world, Player, eid);
  addComponent(ctx.world, OurPlayer, eid);
  // Networked component isn't reset when removed so reset on add
  addComponent(ctx.world, Networked, eid, true);

  addChild(ctx.activeScene, eid);

  const spawnPoints = spawnPointQuery(ctx.world);
  if (spawnPoints.length > 0) {
    spawnEntity(ctx, spawnPoints, eid);
  }

  return eid;
}

function loadRemotePlayerRig(
  ctx: GameState,
  physics: PhysicsModuleState,
  input: GameInputModule,
  network: GameNetworkState,
  peerId: string
) {
  const eid = createPrefabEntity(ctx, "avatar", true);

  // TODO: we only want to remove interactable for the other connected players' entities so they can't focus their own avatar, but we want to kee them interactable for the host's entity
  removeInteractableComponent(ctx, physics, eid);

  associatePeerWithEntity(network, peerId, eid);

  // setup positional audio emitter for VoIP
  addRemoteNodeComponent(ctx, eid, {
    name: peerId,
    audioEmitter: createRemotePositionalAudioEmitter(ctx, {
      sources: [
        createRemoteMediaStreamSource(ctx, {
          stream: createRemoteMediaStream(ctx, { streamId: peerId }),
        }),
      ],
    }),
  });

  // caveat: if owned added after player, this local player entity is added to enteredRemotePlayerQuery
  // TODO: add Authoring component for authoritatively controlled entities as a host,
  //       use Owned to distinguish actual ownership on all clients
  addComponent(ctx.world, Owned, eid);
  addComponent(ctx.world, Player, eid);
  // Networked component isn't reset when removed so reset on add
  addComponent(ctx.world, Networked, eid, true);

  addChild(ctx.activeScene, eid);

  const spawnPoints = spawnPointQuery(ctx.world);
  if (spawnPoints.length > 0) {
    spawnEntity(ctx, spawnPoints, eid);
  }
}

function swapToFlyPlayerRig(ctx: GameState, physics: PhysicsModuleState, eid: number) {
  removeComponent(ctx.world, PhysicsControls, eid);
  removeComponent(ctx.world, RigidBody, eid);

  addComponent(ctx.world, FlyControls, eid);
  FlyControls.set(eid, { speed: 10 });
}

function swapToPlayerRig(ctx: GameState, physics: PhysicsModuleState, eid: number) {
  removeComponent(ctx.world, FlyControls, eid);

  addComponent(ctx.world, PhysicsControls, eid);
  addAvatarRigidBody(ctx, physics, eid);
}

export function ThirdroomSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);
  if (network.authoritative && !isHost(network)) {
    return;
  }

  const input = getModule(ctx, InputModule);
  const physics = getModule(ctx, PhysicsModule);

  const rigs = inputControllerQuery(ctx.world);
  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const controller = getInputController(input, eid);
    updateThirdroom(ctx, physics, controller, eid);
  }
}

function updateThirdroom(ctx: GameState, physics: PhysicsModuleState, controller: InputController, player: number) {
  const toggleFlyMode = controller.actions.get("toggleFlyMode") as ButtonActionState;
  if (toggleFlyMode.pressed) {
    if (hasComponent(ctx.world, FlyControls, player)) {
      swapToPlayerRig(ctx, physics, player);
    } else {
      swapToFlyPlayerRig(ctx, physics, player);
    }
  }
}
