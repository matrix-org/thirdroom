import { defineQuery, hasComponent } from "bitecs";
import { vec3 } from "gl-matrix";
import RAPIER from "@dimforge/rapier3d-compat";

import { SpawnPoint } from "../../engine/component/SpawnPoint";
import { addChild } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { NetworkModule, setLocalPeerId } from "../../engine/network/network.game";
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
  ActionBarItem,
} from "./thirdroom.common";
import { loadDefaultGLTFScene, loadGLTF } from "../../engine/gltf/gltf.game";
import { createRemotePerspectiveCamera } from "../../engine/camera/camera.game";
import { addRigidBody, PhysicsModule, registerCollisionHandler } from "../../engine/physics/physics.game";
import { waitForCurrentSceneToRender } from "../../engine/renderer/renderer.game";
import { boundsCheckCollisionGroups } from "../../engine/physics/CollisionGroups";
import { ourPlayerQuery, Player } from "../../engine/player/Player";
import { enableActionMap } from "../../engine/input/ActionMappingSystem";
import { InputModule } from "../../engine/input/input.game";
import { spawnEntity } from "../../engine/utils/spawnEntity";
import { addScriptComponent, loadScript, Script } from "../../engine/scripting/scripting.game";
import { SamplerMapping } from "../../engine/resource/schema";
import {
  ResourceModule,
  getRemoteResource,
  tryGetRemoteResource,
  createRemoteResourceManager,
} from "../../engine/resource/resource.game";
import {
  RemoteEnvironment,
  RemoteImage,
  RemoteNode,
  RemoteReflectionProbe,
  RemoteSampler,
  RemoteScene,
  RemoteTexture,
  RemoteWorld,
  removeObjectFromWorld,
} from "../../engine/resource/RemoteResources";
import { waitUntil } from "../../engine/utils/waitUntil";
import { findResourceRetainerRoots, findResourceRetainers } from "../../engine/resource/findResourceRetainers";
import { RemoteResource } from "../../engine/resource/RemoteResourceClass";
import { actionBarMap, setDefaultActionBarItems } from "./action-bar.game";
import { createDisposables } from "../../engine/utils/createDisposables";
import { registerPlayerPrefabs, loadPlayerRig } from "../../engine/player/PlayerRig";

export interface ThirdRoomModuleState {
  actionBarItems: ActionBarItem[];
}

const tempSpawnPoints: RemoteNode[] = [];

export function getSpawnPoints(ctx: GameState): RemoteNode[] {
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
    return {
      actionBarItems: [],
    };
  },
  async init(ctx) {
    const dispose = createDisposables([
      registerMessageHandler(ctx, ThirdRoomMessageType.LoadWorld, onLoadWorld),
      registerMessageHandler(ctx, ThirdRoomMessageType.EnterWorld, onEnterWorld),
      registerMessageHandler(ctx, ThirdRoomMessageType.ExitWorld, onExitWorld),
      registerMessageHandler(ctx, ThirdRoomMessageType.PrintThreadState, onPrintThreadState),
      registerMessageHandler(ctx, ThirdRoomMessageType.PrintResources, onPrintResources),
      registerMessageHandler(ctx, ThirdRoomMessageType.GLTFViewerLoadGLTF, onGLTFViewerLoadGLTF),
      registerMessageHandler(ctx, ThirdRoomMessageType.FindResourceRetainers, onFindResourceRetainers),
    ]);

    loadGLTF(ctx, "/gltf/full-animation-rig.glb").catch((error) => {
      console.error("Error loading avatar:", error);
    });

    registerPlayerPrefabs(ctx);

    // create out of bounds floor check
    const { physicsWorld } = getModule(ctx, PhysicsModule);
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

    const disposeCollisionHandler = registerCollisionHandler(ctx, (eid1, eid2, handle1, handle2, started) => {
      const objectEid = handle1 !== rigidBody.handle ? eid1 : handle2 !== rigidBody.handle ? eid2 : undefined;
      const floorHandle = handle1 === rigidBody.handle ? handle1 : handle2 === rigidBody.handle ? handle2 : undefined;

      if (floorHandle === undefined || objectEid === undefined || !started) {
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

    enableActionMap(ctx, actionBarMap);

    return () => {
      dispose();
      disposeCollisionHandler();
    };
  },
});

async function onLoadWorld(ctx: GameState, message: LoadWorldMessage) {
  // TODO: Move to loading in a system and spawning all resources in a single frame
  // World load lifecycle handled by GLTFLoader component etc.
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

// when we join the world
async function onEnterWorld(ctx: GameState, message: EnterWorldMessage) {
  try {
    const network = getModule(ctx, NetworkModule);
    const physics = getModule(ctx, PhysicsModule);
    const input = getModule(ctx, InputModule);

    setLocalPeerId(ctx, message.localPeerId);

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

  setDefaultActionBarItems(ctx);

  const transientScene = new RemoteScene(ctx.resourceManager, {
    name: "Transient Scene",
  });

  const resourceManager = createRemoteResourceManager(ctx, "environment");

  const environmentGLTFResource = await loadGLTF(ctx, url, { fileMap, resourceManager });

  let script: Script | undefined;

  if (scriptUrl) {
    script = await loadScript(ctx, resourceManager, scriptUrl);
  }

  const environmentScene = loadDefaultGLTFScene(ctx, environmentGLTFResource, {
    createDefaultMeshColliders: true,
    rootIsStatic: true,
  }) as RemoteScene;

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
