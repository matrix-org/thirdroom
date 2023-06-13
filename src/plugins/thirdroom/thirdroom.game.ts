import { defineQuery, hasComponent } from "bitecs";
import { vec3 } from "gl-matrix";
import RAPIER from "@dimforge/rapier3d-compat";

import { SpawnPoint } from "../../engine/component/SpawnPoint";
import { addChild } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import {
  createQueuedMessageHandler,
  defineModule,
  getModule,
  QueuedMessageHandler,
  registerMessageHandler,
  Thread,
} from "../../engine/module/module.common";
import { NetworkModule, setLocalPeerId } from "../../engine/network/network.game";
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
} from "./thirdroom.common";
import { GLTFResource, loadDefaultGLTFScene, loadGLTF } from "../../engine/gltf/gltf.game";
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
import { createSingletonTaskRunner } from "../../engine/utils/AsyncTaskRunner";

type WorldLoaderMessage = LoadWorldMessage | EnterWorldMessage | ExitWorldMessage;

export interface ThirdRoomModuleState {
  worldLoaderMessages: QueuedMessageHandler<WorldLoaderMessage>;
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
      worldLoaderMessages: createQueuedMessageHandler([
        ThirdRoomMessageType.LoadWorld,
        ThirdRoomMessageType.EnterWorld,
        ThirdRoomMessageType.ExitWorld,
      ]),
      actionBarItems: [],
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

    enableActionMap(input, actionBarMap);

    return () => {
      dispose();
      disposeCollisionHandler();
    };
  },
});

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

function disposeWorld(worldResource: RemoteWorld) {
  worldResource.activeCameraNode = undefined;
  worldResource.activeAvatarNode = undefined;
  worldResource.environment = undefined;
  worldResource.firstNode = undefined;
}

export const spawnPointQuery = defineQuery([SpawnPoint]);

const worldLoaderTaskRunner = createSingletonTaskRunner();

export function WorldLoaderSystem(ctx: GameState) {
  const { worldLoaderMessages } = getModule(ctx, ThirdRoomModule);
  let message: WorldLoaderMessage | undefined;

  while ((message = worldLoaderMessages.dequeue())) {
    if (message.type === ThirdRoomMessageType.LoadWorld) {
      worldLoaderTaskRunner.run([ctx, message], loadWorld as any);
    } else if (message.type === ThirdRoomMessageType.EnterWorld) {
      worldLoaderTaskRunner.run([ctx, message], enterWorld as any);
    } else if (message.type === ThirdRoomMessageType.ExitWorld) {
      worldLoaderTaskRunner.cancel();
      exitWorld(ctx, message);
    }
  }

  worldLoaderTaskRunner.update();
}

function* loadWorld([ctx, message]: [GameState, LoadWorldMessage], signal: AbortSignal) {
  try {
    setDefaultActionBarItems(ctx);

    const transientScene = new RemoteScene(ctx.resourceManager, {
      name: "Transient Scene",
    });

    const resourceManager = createRemoteResourceManager(ctx, "environment");

    const environmentGLTFResource: GLTFResource = yield loadGLTF(ctx, message.url, {
      fileMap: message.fileMap,
      resourceManager,
      signal,
    });

    let script: Script | undefined;

    if (message.scriptUrl) {
      script = yield loadScript(ctx, resourceManager, message.scriptUrl, signal);
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
function* enterWorld([ctx, message]: [GameState, EnterWorldMessage], signal: AbortSignal) {
  try {
    const network = getModule(ctx, NetworkModule);
    const physics = getModule(ctx, PhysicsModule);
    const input = getModule(ctx, InputModule);

    setLocalPeerId(ctx, message.localPeerId);

    loadPlayerRig(ctx, physics, input, network);

    yield waitUntil(() => ourPlayerQuery(ctx.world).length > 0);

    yield waitForCurrentSceneToRender(ctx, 10);

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

function exitWorld(ctx: GameState, message: ExitWorldMessage) {
  disposeWorld(ctx.worldResource);
  ctx.sendMessage<ExitedWorldMessage>(Thread.Main, {
    type: ThirdRoomMessageType.ExitedWorld,
  });
}
