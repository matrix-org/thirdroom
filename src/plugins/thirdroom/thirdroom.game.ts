import { defineQuery, hasComponent } from "bitecs";
import RAPIER from "@dimforge/rapier3d-compat";

import { SpawnPoint } from "../../engine/component/SpawnPoint";
import { addChild } from "../../engine/component/transform";
import { GameContext } from "../../engine/GameTypes";
import {
  createQueuedMessageHandler,
  defineModule,
  getModule,
  QueuedMessageHandler,
  registerMessageHandler,
  Thread,
} from "../../engine/module/module.common";
import { addPeerId, NetworkModule, removePeerId } from "../../engine/network/network.game";
import {
  EnterWorldMessage,
  WorldLoadedMessage,
  WorldLoadErrorMessage,
  ExitWorldMessage,
  LoadWorldMessage,
  PrintThreadStateMessage,
  ThirdRoomMessageType,
  ExitedWorldMessage,
  PrintResourcesMessage,
  EnteredWorldMessage,
  EnterWorldErrorMessage,
  FindResourceRetainersMessage,
  ActionBarItem,
  SetObjectCapMessage,
  ReloadWorldMessage,
  LoadWorldOptions,
  ReloadedWorldMessage,
  ReloadWorldErrorMessage,
} from "./thirdroom.common";
import { GLTFResource, loadDefaultGLTFScene, loadGLTF } from "../../engine/gltf/gltf.game";
import {
  addPhysicsBody,
  addPhysicsCollider,
  PhysicsModule,
  registerCollisionHandler,
} from "../../engine/physics/physics.game";
import { boundsCheckCollisionGroups } from "../../engine/physics/CollisionGroups";
import { Player } from "../../engine/player/Player";
import { enableActionMap } from "../../engine/input/ActionMappingSystem";
import { InputModule } from "../../engine/input/input.game";
import { spawnEntity } from "../../engine/utils/spawnEntity";
import { addScriptComponent, loadScript, Script } from "../../engine/scripting/scripting.game";
import { ColliderType, PhysicsBodyType, SamplerMapping } from "../../engine/resource/schema";
import {
  ResourceModule,
  getRemoteResource,
  tryGetRemoteResource,
  createRemoteResourceManager,
} from "../../engine/resource/resource.game";
import {
  RemoteCollider,
  RemoteEnvironment,
  RemoteImage,
  RemoteNode,
  RemoteReflectionProbe,
  RemoteSampler,
  RemoteScene,
  RemoteTexture,
  removeObjectFromWorld,
  RemotePhysicsBody,
} from "../../engine/resource/RemoteResources";
import { findResourceRetainerRoots, findResourceRetainers } from "../../engine/resource/findResourceRetainers";
import { RemoteResource } from "../../engine/resource/RemoteResourceClass";
import { actionBarMap, setDefaultActionBarItems } from "./action-bar.game";
import { createDisposables } from "../../engine/utils/createDisposables";
import {
  registerPlayerPrefabs,
  loadPlayerRig,
  loadNetworkedPlayerRig,
  spawnPlayer,
} from "../../engine/player/PlayerRig";
import { MAX_OBJECT_CAP } from "../../engine/config.common";

type WorldLoaderMessage = LoadWorldMessage | EnterWorldMessage | ExitWorldMessage | ReloadWorldMessage;

enum WorldLoadState {
  Uninitialized,
  Loading,
  Loaded,
  Entered,
}

export interface ThirdRoomModuleState {
  worldLoaderMessages: QueuedMessageHandler<WorldLoaderMessage>;
  actionBarItems: ActionBarItem[];
  loadState: WorldLoadState;
  loadWorldPromise?: Promise<void>;
  loadWorldAbortController?: AbortController;
  environmentScript?: Script;
  environmentGLTFResource?: GLTFResource;
  maxObjectCap: number;
}

const tempSpawnPoints: RemoteNode[] = [];

export function getSpawnPoints(ctx: GameContext): RemoteNode[] {
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

export const ThirdRoomModule = defineModule<GameContext, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {
      worldLoaderMessages: createQueuedMessageHandler([
        ThirdRoomMessageType.LoadWorld,
        ThirdRoomMessageType.EnterWorld,
        ThirdRoomMessageType.ExitWorld,
        ThirdRoomMessageType.ReloadWorld,
      ]),
      actionBarItems: [],
      loadState: WorldLoadState.Uninitialized,
      maxObjectCap: MAX_OBJECT_CAP,
    };
  },
  async init(ctx) {
    const { worldLoaderMessages } = getModule(ctx, ThirdRoomModule);
    const input = getModule(ctx, InputModule);

    const dispose = createDisposables([
      worldLoaderMessages.register(ctx),
      registerMessageHandler(ctx, ThirdRoomMessageType.PrintThreadState, onPrintThreadState),
      registerMessageHandler(ctx, ThirdRoomMessageType.PrintResources, onPrintResources),
      registerMessageHandler(ctx, ThirdRoomMessageType.FindResourceRetainers, onFindResourceRetainers),
      registerMessageHandler(ctx, ThirdRoomMessageType.SetObjectCap, onSetObjectCap),
    ]);

    loadGLTF(ctx, "/gltf/full-animation-rig.glb").catch((error) => {
      console.error("Error loading avatar:", error);
    });

    registerPlayerPrefabs(ctx);

    // create out of bounds floor check
    const physics = getModule(ctx, PhysicsModule);
    const size = 10000;
    const oobFloor = new RemoteNode(ctx.resourceManager, {
      name: "Out of Bounds Floor",
    });

    oobFloor.position.set([size / 2, -150, size / 2]);

    addPhysicsCollider(
      ctx.world,
      oobFloor,
      new RemoteCollider(ctx.resourceManager, {
        type: ColliderType.Box,
        size: [size, 50, size],
        activeEvents: RAPIER.ActiveEvents.COLLISION_EVENTS,
        collisionGroups: boundsCheckCollisionGroups,
      })
    );

    addPhysicsBody(
      ctx.world,
      physics,
      oobFloor,
      new RemotePhysicsBody(ctx.resourceManager, {
        type: PhysicsBodyType.Static,
      })
    );

    addChild(ctx.worldResource.persistentScene, oobFloor);

    const disposeCollisionHandler = registerCollisionHandler(ctx, (eid1, eid2, handle1, handle2, started) => {
      const floorBody = oobFloor.physicsBody!.body!;
      const objectEid = handle1 !== floorBody.handle ? eid1 : handle2 !== floorBody.handle ? eid2 : undefined;
      const floorHandle = handle1 === floorBody.handle ? handle1 : handle2 === floorBody.handle ? handle2 : undefined;

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

    enableActionMap(input, actionBarMap);

    return () => {
      dispose();
      disposeCollisionHandler();
    };
  },
});

function onPrintThreadState(ctx: GameContext, message: PrintThreadStateMessage) {
  console.log(Thread.Game, ctx);
}

function onPrintResources(ctx: GameContext, message: PrintResourcesMessage) {
  const resourceMap: { [key: string]: RemoteResource[] } = {};

  const { resourcesByType, resourceDefByType } = getModule(ctx, ResourceModule);

  for (const [resourceType, resources] of resourcesByType) {
    const resourceDef = resourceDefByType.get(resourceType)!;
    resourceMap[resourceDef.name] = resources;
  }

  console.log(resourceMap);
}

function onFindResourceRetainers(ctx: GameContext, message: FindResourceRetainersMessage) {
  const { refs, refCount } = findResourceRetainers(ctx, message.resourceId);
  const roots = findResourceRetainerRoots(ctx, message.resourceId);

  console.log({
    resourceId: message.resourceId,
    refCount,
    refs,
    roots,
  });
}

function disposeWorld(ctx: GameContext) {
  const thirdroom = getModule(ctx, ThirdRoomModule);

  if (thirdroom.loadWorldAbortController) {
    thirdroom.loadWorldAbortController.abort();
  }

  thirdroom.loadState = WorldLoadState.Uninitialized;
  thirdroom.loadWorldAbortController = undefined;
  thirdroom.loadWorldPromise = undefined;
  thirdroom.environmentGLTFResource = undefined;
  thirdroom.environmentScript = undefined;

  const worldResource = ctx.worldResource;
  worldResource.activeCameraNode = undefined;
  worldResource.activeAvatarNode = undefined;
  worldResource.environment = undefined;
  worldResource.firstNode = undefined;
}

export const spawnPointQuery = defineQuery([SpawnPoint]);

export function WorldLoaderSystem(ctx: GameContext) {
  const thirdroom = getModule(ctx, ThirdRoomModule);
  let message: WorldLoaderMessage | undefined;

  while ((message = thirdroom.worldLoaderMessages.dequeue())) {
    if (message.type === ThirdRoomMessageType.LoadWorld) {
      thirdroom.loadWorldPromise = onLoadWorld(ctx, message);
    } else if (message.type === ThirdRoomMessageType.ReloadWorld) {
      thirdroom.loadWorldPromise = onReloadWorld(ctx, message);
    } else if (message.type === ThirdRoomMessageType.EnterWorld) {
      onEnterWorld(ctx, message);
    } else if (message.type === ThirdRoomMessageType.ExitWorld) {
      onExitWorld(ctx, message);
    }
  }
}

async function onLoadWorld(ctx: GameContext, message: LoadWorldMessage) {
  try {
    await loadWorld(ctx, message.environmentUrl, message.options);

    ctx.sendMessage<WorldLoadedMessage>(Thread.Main, {
      type: ThirdRoomMessageType.WorldLoaded,
      id: message.id,
      url: message.environmentUrl,
    });
  } catch (error: any) {
    disposeWorld(ctx);

    console.error(error);

    ctx.sendMessage<WorldLoadErrorMessage>(Thread.Main, {
      type: ThirdRoomMessageType.WorldLoadError,
      id: message.id,
      url: message.environmentUrl,
      error: error.message || "Unknown error",
    });
  }
}

async function loadWorld(ctx: GameContext, environmentUrl: string, options: LoadWorldOptions = {}) {
  const thirdroom = getModule(ctx, ThirdRoomModule);

  if (thirdroom.loadState !== WorldLoadState.Uninitialized) {
    throw new Error("Cannot load a world when world already loaded / loading / entered.");
  }

  thirdroom.loadWorldAbortController = new AbortController();
  const signal = thirdroom.loadWorldAbortController.signal;
  thirdroom.loadState = WorldLoadState.Loading;

  setDefaultActionBarItems(ctx);

  const resourceManager = createRemoteResourceManager(ctx, "environment");

  thirdroom.environmentGLTFResource = await loadGLTF(ctx, environmentUrl, {
    fileMap: options.fileMap,
    resourceManager,
    signal,
  });

  if (options.environmentScriptUrl) {
    thirdroom.environmentScript = await loadScript(ctx, resourceManager, options.environmentScriptUrl, signal);

    thirdroom.environmentScript.initialize();
  }

  thirdroom.loadState = WorldLoadState.Loaded;
  thirdroom.loadWorldPromise = undefined;
  thirdroom.loadWorldAbortController = undefined;
}

// when we join the world
function onEnterWorld(ctx: GameContext, message: EnterWorldMessage) {
  try {
    enterWorld(ctx, message.localPeerId);

    ctx.sendMessage<EnteredWorldMessage>(Thread.Main, {
      type: ThirdRoomMessageType.EnteredWorld,
      id: message.id,
    });
  } catch (error: any) {
    disposeWorld(ctx);

    console.error(error);

    ctx.sendMessage<EnterWorldErrorMessage>(Thread.Main, {
      type: ThirdRoomMessageType.EnterWorldError,
      id: message.id,
      error: error.message || "Unknown error",
    });
  }
}

function enterWorld(ctx: GameContext, localPeerId?: string) {
  const thirdroom = getModule(ctx, ThirdRoomModule);

  if (thirdroom.loadState !== WorldLoadState.Loaded) {
    throw new Error("Cannot enter world when world is not loaded.");
  }

  const network = getModule(ctx, NetworkModule);
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);
  const { environmentScript, environmentGLTFResource } = getModule(ctx, ThirdRoomModule);

  if (!environmentGLTFResource) {
    throw new Error("Cannot enter world: environment glTF resource not yet loaded.");
  }

  const environmentScene = loadDefaultGLTFScene(ctx, environmentGLTFResource, {
    createDefaultMeshColliders: true,
    rootIsStatic: true,
  }) as RemoteScene;

  if (!environmentScene.reflectionProbe || !environmentScene.backgroundTexture) {
    const defaultEnvironmentMapTexture = new RemoteTexture(ctx.resourceManager, {
      name: "Environment Map Texture",
      source: new RemoteImage(ctx.resourceManager, {
        name: "Environment Map Image",
        uri: "/cubemap/clouds_2k.hdr",
        flipY: true,
      }),
      sampler: new RemoteSampler(ctx.resourceManager, {
        mapping: SamplerMapping.EquirectangularReflectionMapping,
      }),
    });

    if (!environmentScene.reflectionProbe) {
      environmentScene.reflectionProbe = new RemoteReflectionProbe(ctx.resourceManager, {
        reflectionProbeTexture: defaultEnvironmentMapTexture,
      });
    }

    if (!environmentScene.backgroundTexture) {
      environmentScene.backgroundTexture = defaultEnvironmentMapTexture;
    }
  }

  const transientScene = new RemoteScene(ctx.resourceManager, {
    name: "Transient Scene",
  });

  ctx.worldResource.environment = new RemoteEnvironment(ctx.resourceManager, {
    publicScene: environmentScene,
    privateScene: transientScene,
  });

  let rig: RemoteNode;

  if (localPeerId) {
    rig = loadNetworkedPlayerRig(ctx, physics, input, network, localPeerId);
  } else {
    rig = loadPlayerRig(ctx, physics, input);
  }

  spawnPlayer(ctx, rig);

  if (environmentScript) {
    addScriptComponent(ctx, environmentScene, environmentScript);
    environmentScript.entered();
  }

  thirdroom.loadState = WorldLoadState.Entered;
}

async function onReloadWorld(ctx: GameContext, message: ReloadWorldMessage) {
  try {
    const network = getModule(ctx, NetworkModule);

    // TODO: probably don't need to do this on reload
    disposeWorld(ctx);

    await loadWorld(ctx, message.environmentUrl, message.options);

    enterWorld(ctx, network.peerId);

    // reinform peers
    for (const peerId of network.peers) {
      removePeerId(ctx, peerId);
      addPeerId(ctx, peerId);
    }

    ctx.sendMessage<ReloadedWorldMessage>(Thread.Main, {
      type: ThirdRoomMessageType.ReloadedWorld,
      id: message.id,
    });
  } catch (error: any) {
    disposeWorld(ctx);

    console.error(error);

    ctx.sendMessage<ReloadWorldErrorMessage>(Thread.Main, {
      type: ThirdRoomMessageType.ReloadWorldError,
      id: message.id,
      error: error.message || "Unknown error",
    });
  }
}

function onExitWorld(ctx: GameContext, message: ExitWorldMessage) {
  disposeWorld(ctx);

  ctx.sendMessage<ExitedWorldMessage>(Thread.Main, {
    type: ThirdRoomMessageType.ExitedWorld,
  });
}

function onSetObjectCap(ctx: GameContext, message: SetObjectCapMessage) {
  const thirdroom = getModule(ctx, ThirdRoomModule);
  thirdroom.maxObjectCap = message.value;
}
