import { addComponent, defineQuery, hasComponent, removeComponent } from "bitecs";
import { quat, vec3 } from "gl-matrix";
import RAPIER from "@dimforge/rapier3d-compat";

import { SpawnPoint } from "../../engine/component/SpawnPoint";
import { addChild } from "../../engine/component/transform";
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
  PrintResourcesMessage,
} from "./thirdroom.common";
import { createNodeFromGLTFURI, loadDefaultGLTFScene, loadGLTF } from "../../engine/gltf/gltf.game";
import { createCamera, createRemotePerspectiveCamera } from "../../engine/camera/camera.game";
import { createPrefabEntity, PrefabType, registerPrefab } from "../../engine/prefab/prefab.game";
import { addFlyControls, FlyControls } from "../FlyCharacterController";
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
import { InteractableType, SamplerMapping, AudioEmitterType } from "../../engine/resource/schema";
import * as Schema from "../../engine/resource/schema";
import { RemoteResource, ResourceDefinition } from "../../engine/resource/ResourceDefinition";
import { addAvatarRigidBody } from "../avatars/addAvatarRigidBody";
import { AvatarOptions, AVATAR_HEIGHT } from "../avatars/common";
import { addKinematicControls, KinematicControls } from "../KinematicCharacterController";
import {
  RemoteAudioData,
  RemoteAudioEmitter,
  RemoteAudioSource,
  RemoteEnvironment,
  RemoteImage,
  RemoteNode,
  RemoteReflectionProbe,
  RemoteSampler,
  RemoteScene,
  RemoteTexture,
  RemoteWorld,
  ResourceModule,
  getRemoteResource,
  tryGetRemoteResource,
  createRemoteObject,
  addObjectToWorld,
  removeObjectFromWorld,
} from "../../engine/resource/resource.game";
import { CharacterControllerType, SceneCharacterControllerComponent } from "../CharacterController";
import { addNametag } from "../nametags/nametags.game";
import { AvatarComponent } from "../avatars/components";

type ThirdRoomModuleState = {};

const addAvatarCamera = (ctx: GameState, rig: RemoteNode) => {
  const camera = createCamera(ctx);
  camera.position[1] = 1.2;
  addChild(rig, camera);
  addCameraYawTargetComponent(ctx.world, rig);
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
  (input: GameInputModule, physics: PhysicsModuleState) => (ctx: GameState, options: AvatarOptions) => {
    const spawnPoints = spawnPointQuery(ctx.world);

    const rig = createNodeFromGLTFURI(ctx, "/gltf/full-animation-rig.glb");
    const obj = createRemoteObject(ctx, rig);

    addComponent(ctx.world, AvatarComponent, rig.eid);
    rig.position.set([0, -1, 0]);
    quat.fromEuler(rig.quaternion, 0, 180, 0);
    rig.scale.set([1.3, 1.3, 1.3]);
    addAvatarCamera(ctx, rig);
    addAvatarController(ctx, input, rig.eid);

    // on container
    const characterControllerType = SceneCharacterControllerComponent.get(
      ctx.worldResource.environment!.publicScene!.eid
    )?.type;
    if (characterControllerType === CharacterControllerType.Fly || spawnPoints.length === 0) {
      addFlyControls(ctx, obj.eid);
    } else {
      addKinematicControls(ctx, obj.eid);
    }

    addAvatarRigidBody(ctx, physics, obj);
    addInteractableComponent(ctx, physics, obj, InteractableType.Player);

    return obj;
  };

const tempSpawnPoints: RemoteNode[] = [];

function getSpawnPoints(ctx: GameState): RemoteNode[] {
  const spawnPoints = spawnPointQuery(ctx.world);
  tempSpawnPoints.length = 0;

  for (let i = 0; i < spawnPoints.length; i++) {
    const eid = spawnPoints[i];
    const node = getRemoteResource<RemoteNode>(ctx, eid);

    if (node) {
      tempSpawnPoints.push(node);
    }
  }

  return tempSpawnPoints;
}

export const ThirdRoomModule = defineModule<GameState, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {};
  },
  async init(ctx) {
    const input = getModule(ctx, InputModule);
    const physics = getModule(ctx, PhysicsModule);

    const disposables = [
      registerMessageHandler(ctx, ThirdRoomMessageType.LoadWorld, onLoadWorld),
      registerMessageHandler(ctx, ThirdRoomMessageType.EnterWorld, onEnterWorld),
      registerMessageHandler(ctx, ThirdRoomMessageType.ExitWorld, onExitWorld),
      registerMessageHandler(ctx, NetworkMessageType.AddPeerId, onAddPeerId),
      registerMessageHandler(ctx, ThirdRoomMessageType.PrintThreadState, onPrintThreadState),
      registerMessageHandler(ctx, ThirdRoomMessageType.PrintResources, onPrintResources),
      registerMessageHandler(ctx, ThirdRoomMessageType.GLTFViewerLoadGLTF, onGLTFViewerLoadGLTF),
    ];

    await loadGLTF(ctx, "/gltf/full-animation-rig.glb");

    registerPrefab(ctx, {
      name: "avatar",
      type: PrefabType.Avatar,
      create: createAvatarRig(input, physics),
    });

    // create out of bounds floor check
    const { collisionHandlers, physicsWorld } = getModule(ctx, PhysicsModule);
    const rigidBody = physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const size = 10000;
    const colliderDesc = RAPIER.ColliderDesc.cuboid(size, 50, size)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
      .setCollisionGroups(boundsCheckCollisionGroups);
    physicsWorld.createCollider(colliderDesc, rigidBody);

    rigidBody.setTranslation(new RAPIER.Vector3(size / 2, -150, size / 2), true);

    collisionHandlers.push((eid1?: number, eid2?: number, handle1?: number, handle2?: number) => {
      const entity = eid1 || eid2;

      if (!entity) return;

      if (hasComponent(ctx.world, Networked, entity) && !hasComponent(ctx.world, Owned, entity)) return;

      const floor = handle1 === rigidBody.handle || handle2 === rigidBody.handle;

      if (entity && floor) {
        const node = tryGetRemoteResource<RemoteNode>(ctx, entity);

        if (
          hasComponent(ctx.world, Networked, entity) &&
          hasComponent(ctx.world, Owned, entity) &&
          !hasComponent(ctx.world, Player, entity)
        ) {
          removeObjectFromWorld(ctx.worldResource, node);
        } else if (hasComponent(ctx.world, Player, entity)) {
          const spawnPoints = getSpawnPoints(ctx);
          spawnEntity(spawnPoints, node);
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
  actionDefs: [
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
      networked: true,
    },
  ],
};

async function onLoadWorld(ctx: GameState, message: LoadWorldMessage) {
  try {
    await loadEnvironment(ctx, message.url, message.scriptUrl);
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

  // wait for peer connections & host before spawning in
  // BUG: this induces a consistently reproducible race condition
  // await waitUntil(() => network.hostId !== "" && network.peers.length > 0);

  loadPlayerRig(ctx, physics, input, network);
}

function onExitWorld(ctx: GameState, message: ExitWorldMessage) {
  disposeWorld(ctx.worldResource);
  ctx.sendMessage<ExitedWorldMessage>(Thread.Main, {
    type: ThirdRoomMessageType.ExitedWorld,
  });
}

function onPrintThreadState(ctx: GameState, message: PrintThreadStateMessage) {
  console.log(Thread.Game, ctx);
}

function onPrintResources(ctx: GameState, message: PrintResourcesMessage) {
  const resourceMap: { [key: string]: RemoteResource<GameState>[] } = {};

  const { resourcesByType, resourceDefByType } = getModule(ctx, ResourceModule);

  for (const [resourceType, resources] of resourcesByType) {
    const resourceDef = resourceDefByType.get(resourceType)!;
    resourceMap[resourceDef.name] = resources;
  }

  console.log(resourceMap);
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

function disposeWorld(worldResource: RemoteWorld) {
  worldResource.activeCameraNode = undefined;
  worldResource.environment = undefined;
  worldResource.firstNode = undefined;
}

async function loadEnvironment(ctx: GameState, url: string, scriptUrl?: string, fileMap?: Map<string, string>) {
  disposeWorld(ctx.worldResource);

  const transientScene = new RemoteScene(ctx.resourceManager, {
    name: "Transient Scene",
  });

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
  }

  const resourceManager = script?.resourceManager || ctx.resourceManager;

  const environmentGLTFResource = await loadGLTF(ctx, url, { fileMap, resourceManager });
  const environmentScene = (await loadDefaultGLTFScene(ctx, environmentGLTFResource)) as RemoteScene;

  if (script) {
    addScriptComponent(ctx, environmentScene, script);
  }

  if (!environmentScene.reflectionProbe || !environmentScene.backgroundTexture) {
    const defaultEnvironmentMapTexture = new RemoteTexture(resourceManager, {
      name: "Environment Map Texture",
      source: new RemoteImage(resourceManager, {
        name: "Environment Map Image",
        uri: "/cubemap/clouds_2k.hdr",
        flipY: true,
      }),
      sampler: new RemoteSampler(resourceManager, {
        mapping: SamplerMapping.EquirectangularReflectionMapping,
      }),
    });

    if (!environmentScene.reflectionProbe) {
      environmentScene.reflectionProbe = new RemoteReflectionProbe(resourceManager, {
        reflectionProbeTexture: defaultEnvironmentMapTexture,
      });
    }

    if (!environmentScene.backgroundTexture) {
      environmentScene.backgroundTexture = defaultEnvironmentMapTexture;
    }
  }

  const environment = new RemoteEnvironment(resourceManager, {
    publicScene: environmentScene,
    privateScene: transientScene,
  });
  ctx.worldResource.environment = environment;
  environment.gltfResource = environmentGLTFResource;

  const spawnPoints = getSpawnPoints(ctx);

  let defaultCamera: RemoteNode | undefined;

  if (!ctx.worldResource.activeCameraNode) {
    defaultCamera = new RemoteNode(ctx.resourceManager, {
      camera: createRemotePerspectiveCamera(ctx),
    });
    addChild(transientScene, defaultCamera);
    ctx.worldResource.activeCameraNode = defaultCamera;
  }

  if (ctx.worldResource.activeCameraNode === defaultCamera && spawnPoints.length > 0) {
    vec3.copy(defaultCamera.position, spawnPoints[0].position);
    defaultCamera.position[1] += 1.6;
    vec3.copy(defaultCamera.quaternion, spawnPoints[0].quaternion);
  }

  if (script) {
    script.ready = true;
  }
}

export const spawnPointQuery = defineQuery([SpawnPoint]);

function loadPlayerRig(ctx: GameState, physics: PhysicsModuleState, input: GameInputModule, network: GameNetworkState) {
  ctx.worldResource.activeCameraNode = undefined;

  const rig = createPrefabEntity(ctx, "avatar");
  const eid = rig.eid;

  addNametag(ctx, AVATAR_HEIGHT, rig, network.peerId);

  associatePeerWithEntity(network, network.peerId, eid);

  // caveat: if owned added after player, this local player entity is added to enteredRemotePlayerQuery
  // TODO: add Authoring component for authoritatively controlled entities as a host,
  //       use Owned to distinguish actual ownership on all clients
  addComponent(ctx.world, Owned, eid);
  addComponent(ctx.world, Player, eid);
  addComponent(ctx.world, OurPlayer, eid);
  // Networked component isn't reset when removed so reset on add
  addComponent(ctx.world, Networked, eid, true);

  const avatar = createRemoteObject(ctx, rig);
  addObjectToWorld(ctx.worldResource, avatar);

  const spawnPoints = getSpawnPoints(ctx);

  if (spawnPoints.length > 0) {
    spawnEntity(spawnPoints, rig);
  }

  embodyAvatar(ctx, physics, input, rig);

  return eid;
}

function loadRemotePlayerRig(
  ctx: GameState,
  physics: PhysicsModuleState,
  input: GameInputModule,
  network: GameNetworkState,
  peerId: string
) {
  const rig = createPrefabEntity(ctx, "avatar", { nametag: true });
  const avatar = createRemoteObject(ctx, rig);
  addObjectToWorld(ctx.worldResource, avatar);

  // TODO: we only want to remove interactable for the other connected players' entities so they can't focus their own avatar, but we want to kee them interactable for the host's entity
  removeInteractableComponent(ctx, physics, avatar);

  addNametag(ctx, AVATAR_HEIGHT, avatar, peerId);

  associatePeerWithEntity(network, peerId, avatar.eid);

  rig.name = peerId;

  // setup positional audio emitter for VoIP
  rig.audioEmitter = new RemoteAudioEmitter(ctx.resourceManager, {
    type: AudioEmitterType.Positional,
    sources: [
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: `mediastream:${peerId}` }),
      }),
    ],
  });

  // caveat: if owned added after player, this local player entity is added to enteredRemotePlayerQuery
  // TODO: add Authoring component for authoritatively controlled entities as a host,
  //       use Owned to distinguish actual ownership on all clients
  addComponent(ctx.world, Owned, avatar.eid);
  addComponent(ctx.world, Player, avatar.eid);
  // Networked component isn't reset when removed so reset on add
  addComponent(ctx.world, Networked, avatar.eid, true);

  const spawnPoints = getSpawnPoints(ctx);
  if (spawnPoints.length > 0) {
    spawnEntity(spawnPoints, rig);
  }
}

function swapToFlyPlayerRig(ctx: GameState, physics: PhysicsModuleState, node: RemoteNode) {
  removeComponent(ctx.world, KinematicControls, node.eid);
  removeComponent(ctx.world, RigidBody, node.eid);

  addComponent(ctx.world, FlyControls, node.eid);
  FlyControls.set(node.eid, { speed: 10 });
}

function swapToPlayerRig(ctx: GameState, physics: PhysicsModuleState, node: RemoteNode) {
  removeComponent(ctx.world, FlyControls, node.eid);
  addComponent(ctx.world, KinematicControls, node.eid);
  addAvatarRigidBody(ctx, physics, node);
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
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const controller = getInputController(input, eid);
    updateThirdroom(ctx, physics, controller, node);
  }
}

function updateThirdroom(ctx: GameState, physics: PhysicsModuleState, controller: InputController, player: RemoteNode) {
  const toggleFlyMode = controller.actionStates.get("toggleFlyMode") as ButtonActionState;
  if (toggleFlyMode.pressed) {
    if (hasComponent(ctx.world, FlyControls, player.eid)) {
      swapToPlayerRig(ctx, physics, player);
    } else {
      swapToFlyPlayerRig(ctx, physics, player);
    }
  }
}
