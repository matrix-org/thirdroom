import { addComponent, defineComponent, defineQuery, hasComponent, removeComponent } from "bitecs";
import { quat, vec3 } from "gl-matrix";
import RAPIER from "@dimforge/rapier3d-compat";

import { SpawnPoint } from "../../engine/component/SpawnPoint";
import { addChild, traverse } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { associatePeerWithEntity, GameNetworkState, NetworkModule } from "../../engine/network/network.game";
import { Networked, Owned } from "../../engine/network/NetworkComponents";
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
  EnteredWorldMessage,
  EnterWorldErrorMessage,
  FindResourceRetainersMessage,
} from "./thirdroom.common";
import { createNodeFromGLTFURI, loadDefaultGLTFScene, loadGLTF } from "../../engine/gltf/gltf.game";
import { createRemotePerspectiveCamera, getCamera } from "../../engine/camera/camera.game";
import { createPrefabEntity, PrefabType, registerPrefab } from "../../engine/prefab/prefab.game";
import { addFlyControls, FlyControls } from "../FlyCharacterController";
import { addRigidBody, PhysicsModule, PhysicsModuleState } from "../../engine/physics/physics.game";
import { getXRMode, waitForCurrentSceneToRender } from "../../engine/renderer/renderer.game";
import { boundsCheckCollisionGroups } from "../../engine/physics/CollisionGroups";
import { OurPlayer, ourPlayerQuery, Player } from "../../engine/component/Player";
import { enableActionMap } from "../../engine/input/ActionMappingSystem";
import { GameInputModule, InputModule } from "../../engine/input/input.game";
import { spawnEntity } from "../../engine/utils/spawnEntity";
import { AddPeerIdMessage, isHost, NetworkMessageType } from "../../engine/network/network.common";
import {
  addInputController,
  createInputController,
  tryGetInputController,
  InputController,
  inputControllerQuery,
} from "../../engine/input/InputController";
import { addCameraPitchTargetComponent, addCameraYawTargetComponent } from "../FirstPersonCamera";
import { addInteractableComponent, GRAB_DISTANCE, removeInteractableComponent } from "../interaction/interaction.game";
import { embodyAvatar } from "../../engine/network/serialization.game";
import { addScriptComponent, loadScript, Script, ScriptComponent } from "../../engine/scripting/scripting.game";
import {
  InteractableType,
  SamplerMapping,
  AudioEmitterType,
  MaterialType,
  MaterialAlphaMode,
} from "../../engine/resource/schema";
import { addAvatarRigidBody } from "../avatars/addAvatarRigidBody";
import { AvatarOptions, AVATAR_HEIGHT, AVATAR_OFFSET } from "../avatars/common";
import { addKinematicControls, KinematicControls } from "../KinematicCharacterController";
import {
  ResourceModule,
  getRemoteResource,
  tryGetRemoteResource,
  createRemoteResourceManager,
} from "../../engine/resource/resource.game";
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
  createRemoteObject,
  addObjectToWorld,
  removeObjectFromWorld,
  getObjectPrivateRoot,
  RemoteObject,
  RemoteMaterial,
} from "../../engine/resource/RemoteResources";
import { CharacterControllerType, SceneCharacterControllerComponent } from "../CharacterController";
import { addNametag } from "../nametags/nametags.game";
import { AvatarComponent } from "../avatars/components";
import { waitUntil } from "../../engine/utils/waitUntil";
import { findResourceRetainerRoots, findResourceRetainers } from "../../engine/resource/findResourceRetainers";
import { teleportEntity } from "../../engine/utils/teleportEntity";
import { getAvatar } from "../avatars/getAvatar";
import { ActionMap, ActionType, BindingType, ButtonActionState } from "../../engine/input/ActionMap";
import { XRMode } from "../../engine/renderer/renderer.common";
import { createLineMesh } from "../../engine/mesh/mesh.game";
import { RemoteResource } from "../../engine/resource/RemoteResourceClass";

type ThirdRoomModuleState = {};

const shouldUseAR = (ctx: GameState) =>
  ctx.worldResource.environment?.publicScene.supportsAR && getXRMode(ctx) === XRMode.ImmersiveAR;

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
    const useAR = shouldUseAR(ctx);

    const spawnPoints = spawnPointQuery(ctx.world);

    const rig = createNodeFromGLTFURI(ctx, "/gltf/full-animation-rig.glb");
    const obj = createRemoteObject(ctx, rig);

    quat.fromEuler(rig.quaternion, 0, 180, 0);
    rig.position.set([0, AVATAR_OFFSET, 0]);
    const s = useAR ? 1 : 1.3;
    rig.scale.set([s, s, s]);

    // on container
    const characterControllerType = SceneCharacterControllerComponent.get(
      ctx.worldResource.environment!.publicScene!.eid
    )?.type;
    if (characterControllerType === CharacterControllerType.Fly || spawnPoints.length === 0) {
      addFlyControls(ctx, obj.eid);
    } else {
      addKinematicControls(ctx, obj.eid);
    }

    const privateRoot = getObjectPrivateRoot(obj);

    const cameraAnchor = new RemoteNode(ctx.resourceManager);
    cameraAnchor.name = "Avatar Camera Anchor";
    const h = AVATAR_HEIGHT - AVATAR_OFFSET - 0.15;
    cameraAnchor.position[1] = useAR ? h / 3.333 : h;
    addChild(privateRoot, cameraAnchor);

    const camera = new RemoteNode(ctx.resourceManager, {
      name: "Avatar Camera",
      camera: createRemotePerspectiveCamera(ctx),
    });
    addChild(cameraAnchor, camera);

    addCameraPitchTargetComponent(ctx.world, cameraAnchor);
    addCameraYawTargetComponent(ctx.world, obj);

    addAvatarController(ctx, input, obj.eid);
    addAvatarRigidBody(ctx, physics, obj);
    addInteractableComponent(ctx, physics, obj, InteractableType.Player);

    addComponent(ctx.world, AvatarComponent, obj.eid);
    AvatarComponent.eid[obj.eid] = rig.eid;

    return obj;
  };

export const XRControllerComponent = defineComponent();
export const XRHeadComponent = defineComponent();
export const XRRayComponent = defineComponent();

const createXRHead = (input: GameInputModule, physics: PhysicsModuleState) => (ctx: GameState, options?: any) => {
  const node = createNodeFromGLTFURI(ctx, `/gltf/headset.glb`);

  quat.fromEuler(node.quaternion, 0, 180, 0);
  node.scale.set([1.2, 1.2, 1.2]);

  const obj = createRemoteObject(ctx, node);
  addComponent(ctx.world, XRHeadComponent, obj.eid);

  return obj;
};

export function createXRRay(ctx: GameState, options: any) {
  const color = options.color || [0, 0.3, 1, 0.3];
  const length = options.length || GRAB_DISTANCE;
  const rayMaterial = new RemoteMaterial(ctx.resourceManager, {
    name: "Ray Material",
    type: MaterialType.Standard,
    baseColorFactor: color,
    emissiveFactor: [0.7, 0.7, 0.7],
    metallicFactor: 0,
    roughnessFactor: 0,
    alphaMode: MaterialAlphaMode.BLEND,
  });
  const mesh = createLineMesh(ctx, length, 0.004, rayMaterial);
  const node = new RemoteNode(ctx.resourceManager, {
    mesh,
  });
  node.position[2] = 0.1;

  const obj = createRemoteObject(ctx, node);
  addComponent(ctx.world, XRRayComponent, obj.eid);

  return obj;
}

const createXRHandLeft = (input: GameInputModule, physics: PhysicsModuleState) => (ctx: GameState, options?: any) => {
  const node = createNodeFromGLTFURI(ctx, `/gltf/controller-left.glb`);
  quat.fromEuler(node.quaternion, 0, 180, 0);
  node.scale.set([1.5, 1.5, 1.5]);

  const obj = createRemoteObject(ctx, node);
  addComponent(ctx.world, XRControllerComponent, obj.eid);

  return obj;
};

const createXRHandRight = (input: GameInputModule, physics: PhysicsModuleState) => (ctx: GameState, options?: any) => {
  const node = createNodeFromGLTFURI(ctx, `/gltf/controller-right.glb`);
  quat.fromEuler(node.quaternion, 0, 180, 0);
  node.scale.set([1.5, 1.5, 1.5]);

  const obj = createRemoteObject(ctx, node);
  addComponent(ctx.world, XRControllerComponent, obj.eid);

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
      registerMessageHandler(ctx, ThirdRoomMessageType.FindResourceRetainers, onFindResourceRetainers),
    ];

    await loadGLTF(ctx, "/gltf/full-animation-rig.glb");

    registerPrefab(ctx, {
      name: "avatar",
      type: PrefabType.Avatar,
      create: createAvatarRig(input, physics),
    });

    registerPrefab(ctx, {
      name: "xr-head",
      type: PrefabType.Avatar,
      create: createXRHead(input, physics),
    });

    registerPrefab(ctx, {
      name: "xr-hand-left",
      type: PrefabType.Avatar,
      create: createXRHandLeft(input, physics),
    });

    registerPrefab(ctx, {
      name: "xr-hand-right",
      type: PrefabType.Avatar,
      create: createXRHandRight(input, physics),
    });

    registerPrefab(ctx, {
      name: "xr-ray",
      type: PrefabType.Avatar,
      create: createXRRay,
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
    const oobCollider = new RemoteNode(ctx.resourceManager, {
      name: "Out of Bounds Collider",
    });
    addRigidBody(ctx, oobCollider, rigidBody);
    addChild(ctx.worldResource.persistentScene, oobCollider);

    collisionHandlers.push((eid1: number, eid2: number, handle1: number, handle2: number) => {
      let objectEid: number | undefined;
      let floorHandle: number | undefined;

      if (hasComponent(ctx.world, RemoteObject, eid1)) {
        objectEid = eid1;
        floorHandle = handle2;
      } else if (hasComponent(ctx.world, RemoteObject, eid2)) {
        objectEid = eid2;
        floorHandle = handle1;
      } else {
        return;
      }

      if (floorHandle !== rigidBody.handle) {
        return;
      }

      const node = tryGetRemoteResource<RemoteNode>(ctx, objectEid);

      if (hasComponent(ctx.world, Player, objectEid)) {
        const spawnPoints = getSpawnPoints(ctx);
        spawnEntity(spawnPoints, node);
      } else {
        removeObjectFromWorld(ctx, node);
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
  id: "thirdroom-action-map",
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
    {
      id: "toggleThirdPerson",
      path: "toggleThirdPerson",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyV",
        },
      ],
    },
  ],
};

async function onLoadWorld(ctx: GameState, message: LoadWorldMessage) {
  try {
    await loadEnvironment(ctx, message.url, message.scriptUrl);

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
  try {
    const network = getModule(ctx, NetworkModule);
    const physics = getModule(ctx, PhysicsModule);
    const input = getModule(ctx, InputModule);

    loadPlayerRig(ctx, physics, input, network);

    await waitUntil(() => ourPlayerQuery(ctx.world).length > 0);

    await waitForCurrentSceneToRender(ctx, 10);

    ctx.sendMessage<EnteredWorldMessage>(Thread.Main, {
      type: ThirdRoomMessageType.EnteredWorld,
      id: message.id,
    });
  } catch (error: any) {
    console.error(error);

    ctx.sendMessage<EnterWorldErrorMessage>(Thread.Main, {
      type: ThirdRoomMessageType.EnterWorldError,
      id: message.id,
      error: error.message || "Unknown error",
    });
  }
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
  const resourceMap: { [key: string]: RemoteResource[] } = {};

  const { resourcesByType, resourceDefByType } = getModule(ctx, ResourceModule);

  for (const [resourceType, resources] of resourcesByType) {
    const resourceDef = resourceDefByType.get(resourceType)!;
    resourceMap[resourceDef.name] = resources;
  }

  console.log(resourceMap);
}

function onFindResourceRetainers(ctx: GameState, message: FindResourceRetainersMessage) {
  const { refs, refCount } = findResourceRetainers(ctx, message.resourceId);
  const roots = findResourceRetainerRoots(ctx, message.resourceId);

  console.log({
    resourceId: message.resourceId,
    refCount,
    refs,
    roots,
  });
}

async function onGLTFViewerLoadGLTF(ctx: GameState, message: GLTFViewerLoadGLTFMessage) {
  try {
    const network = getModule(ctx, NetworkModule);
    const physics = getModule(ctx, PhysicsModule);
    const input = getModule(ctx, InputModule);

    await loadEnvironment(ctx, message.url, message.scriptUrl, message.fileMap);

    loadPlayerRig(ctx, physics, input, network);

    await waitUntil(() => ourPlayerQuery(ctx.world).length > 0);

    await waitForCurrentSceneToRender(ctx, 10);

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
  worldResource.activeAvatarNode = undefined;
  worldResource.environment = undefined;
  worldResource.firstNode = undefined;
}

async function loadEnvironment(ctx: GameState, url: string, scriptUrl?: string, fileMap?: Map<string, string>) {
  disposeWorld(ctx.worldResource);

  const transientScene = new RemoteScene(ctx.resourceManager, {
    name: "Transient Scene",
  });

  const resourceManager = createRemoteResourceManager(ctx);

  let script: Script | undefined;

  if (scriptUrl) {
    script = await loadScript(ctx, resourceManager, scriptUrl);
  }

  const environmentGLTFResource = await loadGLTF(ctx, url, { fileMap, resourceManager });
  const environmentScene = (await loadDefaultGLTFScene(ctx, environmentGLTFResource, {
    createDefaultMeshColliders: true,
  })) as RemoteScene;

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

  ctx.worldResource.environment = new RemoteEnvironment(ctx.resourceManager, {
    publicScene: environmentScene,
    privateScene: transientScene,
  });

  await waitForCurrentSceneToRender(ctx);

  if (ctx.worldResource.environment) {
    traverse(ctx.worldResource.environment.publicScene, (node) => {
      node.isStatic = false;
    });
  }

  const spawnPoints = getSpawnPoints(ctx);

  let defaultCamera: RemoteNode | undefined;

  if (!ctx.worldResource.activeCameraNode) {
    defaultCamera = new RemoteNode(ctx.resourceManager, {
      name: "Default Camera",
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
    addScriptComponent(ctx, environmentScene, script);
  }
}

export const spawnPointQuery = defineQuery([SpawnPoint]);

function loadPlayerRig(ctx: GameState, physics: PhysicsModuleState, input: GameInputModule, network: GameNetworkState) {
  ctx.worldResource.activeCameraNode = undefined;

  const rig = createPrefabEntity(ctx, "avatar");
  const eid = rig.eid;

  // addNametag(ctx, AVATAR_HEIGHT + AVATAR_OFFSET, rig, network.peerId);

  associatePeerWithEntity(network, network.peerId, eid);

  rig.name = network.peerId;

  // setup positional audio emitter for footsteps
  rig.audioEmitter = new RemoteAudioEmitter(ctx.resourceManager, {
    type: AudioEmitterType.Positional,
    sources: [
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-01.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-02.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-03.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-04.ogg" }),
      }),
    ],
  });

  // caveat: if owned added after player, this local player entity is added to enteredRemotePlayerQuery
  // TODO: add Authoring component for authoritatively controlled entities as a host,
  //       use Owned to distinguish actual ownership on all clients
  addComponent(ctx.world, Owned, eid);
  addComponent(ctx.world, Player, eid);
  addComponent(ctx.world, OurPlayer, eid);
  // Networked component isn't reset when removed so reset on add
  addComponent(ctx.world, Networked, eid, true);

  addObjectToWorld(ctx, rig);

  const spawnPoints = getSpawnPoints(ctx);

  if (spawnPoints.length > 0) {
    spawnEntity(spawnPoints, rig);
  } else {
    teleportEntity(rig, vec3.fromValues(0, 0, 0), quat.create());
  }

  embodyAvatar(ctx, physics, input, rig);

  const gltfScene = ctx.worldResource.environment?.publicScene;

  if (gltfScene && hasComponent(ctx.world, ScriptComponent, gltfScene.eid)) {
    const script = ScriptComponent.get(gltfScene.eid);

    if (script) {
      script.entered();
    }
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
  console.log("loadRemotePlayerRig for peerId", peerId);
  const rig = createPrefabEntity(ctx, "avatar");

  // TODO: we only want to remove interactable for the other connected players' entities so they can't focus their own avatar, but we want to keep them interactable for the host's entity
  removeInteractableComponent(ctx, physics, rig);

  addNametag(ctx, AVATAR_HEIGHT + AVATAR_OFFSET, rig, peerId);

  associatePeerWithEntity(network, peerId, rig.eid);

  rig.name = peerId;

  // setup positional audio emitter for VoIP & footsteps
  rig.audioEmitter = new RemoteAudioEmitter(ctx.resourceManager, {
    type: AudioEmitterType.Positional,
    sources: [
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-01.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-02.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-03.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-04.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: `mediastream:${peerId}` }),
      }),
    ],
  });

  // caveat: if owned added after player, this local player entity is added to enteredRemotePlayerQuery
  // TODO: add Authoring component for authoritatively controlled entities as a host,
  //       use Owned to distinguish actual ownership on all clients
  addComponent(ctx.world, Owned, rig.eid);
  addComponent(ctx.world, Player, rig.eid);
  // Networked component isn't reset when removed so reset on add
  addComponent(ctx.world, Networked, rig.eid, true);

  addObjectToWorld(ctx, rig);

  const spawnPoints = getSpawnPoints(ctx);
  if (spawnPoints.length > 0) {
    spawnEntity(spawnPoints, rig);
  }
}

function swapToFlyPlayerRig(ctx: GameState, physics: PhysicsModuleState, node: RemoteNode) {
  removeComponent(ctx.world, KinematicControls, node.eid);
  addFlyControls(ctx, node.eid);
}

function swapToPlayerRig(ctx: GameState, physics: PhysicsModuleState, node: RemoteNode) {
  removeComponent(ctx.world, FlyControls, node.eid);
  addComponent(ctx.world, KinematicControls, node.eid);
}

const ThirdPersonComponent = defineComponent();

function swapToThirdPerson(ctx: GameState, node: RemoteNode) {
  addComponent(ctx.world, ThirdPersonComponent, node.eid);
  const camera = getCamera(ctx, node);
  camera.position[2] = 2;
  camera.parent!.position[0] = 0.8;

  const avatar = getAvatar(ctx, node);
  avatar.visible = true;
}

function swapToFirstPerson(ctx: GameState, node: RemoteNode) {
  removeComponent(ctx.world, ThirdPersonComponent, node.eid);
  const camera = getCamera(ctx, node);
  camera.position[2] = 0;
  camera.parent!.position[0] = 0;

  const avatar = getAvatar(ctx, node);
  avatar.visible = false;
}

export function ThirdroomSystem(ctx: GameState) {
  const input = getModule(ctx, InputModule);
  const physics = getModule(ctx, PhysicsModule);

  const rigs = inputControllerQuery(ctx.world);

  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const playerNode = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const controller = tryGetInputController(input, eid);
    updateCharacterController(ctx, physics, controller, playerNode);
  }
}

function updateCharacterController(
  ctx: GameState,
  physics: PhysicsModuleState,
  controller: InputController,
  player: RemoteNode
) {
  const toggleFlyMode = controller.actionStates.get("toggleFlyMode") as ButtonActionState;
  if (toggleFlyMode.pressed) {
    if (hasComponent(ctx.world, FlyControls, player.eid)) {
      swapToPlayerRig(ctx, physics, player);
    } else {
      swapToFlyPlayerRig(ctx, physics, player);
    }
  }

  const toggleCameraMode = controller.actionStates.get("toggleThirdPerson") as ButtonActionState;
  if (toggleCameraMode.pressed) {
    if (hasComponent(ctx.world, ThirdPersonComponent, player.eid)) {
      swapToFirstPerson(ctx, player);
    } else {
      swapToThirdPerson(ctx, player);
    }
  }
}
