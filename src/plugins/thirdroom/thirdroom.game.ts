import { addEntity, defineQuery } from "bitecs";
import { vec3, mat4, quat } from "gl-matrix";

import { SpawnPoint } from "../../engine/component/SpawnPoint";
import {
  addChild,
  addTransformComponent,
  removeRecursive,
  setEulerFromQuaternion,
  setQuaternionFromEuler,
  Transform,
} from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { NetworkModule } from "../../engine/network/network.game";
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
import { createFlyPlayerRig } from "../FlyCharacterController";
import { createContainerizedAvatar } from "../avatar";

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
      registerMessageHandler(ctx, ThirdRoomMessageType.PrintThreadState, onPrintThreadState),
      registerMessageHandler(ctx, ThirdRoomMessageType.GLTFViewerLoadGLTF, onGLTFViewerLoadGLTF),
    ];

    // const cube = addEntity(ctx.world);
    // addTransformComponent(ctx.world, cube);
    // vec3.set(Transform.position[cube], 0, 0, -5);
    // addCubeMesh(ctx, cube);
    // addChild(ctx.activeScene, cube);
    // addComponent(ctx.world, SpinnyCube, cube);

    // const bachAudio = createRemoteAudio(ctx, "/audio/bach.mp3");

    // registerPrefab(ctx, {
    //   name: "random-cube",
    //   create: createCube,
    // });

    // registerPrefab(ctx, {
    //   name: "red-cube",
    //   create: () => {
    //     const eid = createCube(
    //       ctx,
    //       createRemoteStandardMaterial(ctx, {
    //         baseColorFactor: [1, 0, 0, 1.0],
    //         roughnessFactor: 0.8,
    //         metallicFactor: 0.8,
    //       })
    //     );
    //     return eid;
    //   },
    // });

    // registerPrefab(ctx, {
    //   name: "musical-cube",
    //   create: () => {
    //     const eid = createCube(
    //       ctx,
    //       createRemoteStandardMaterial(ctx, {
    //         baseColorFactor: [1, 0, 0, 1.0],
    //         roughnessFactor: 0.8,
    //         metallicFactor: 0.8,
    //       })
    //     );

    //     const remoteNode = RemoteNodeComponent.get(eid)!;

    //     remoteNode.audioEmitter = createRemotePositionalAudioEmitter(ctx, {
    //       sources: [
    //         createRemoteAudioSource(ctx, {
    //           audio: bachAudio,
    //         }),
    //       ],
    //     });

    //     return eid;
    //   },
    // });

    // registerPrefab(ctx, {
    //   name: "green-cube",
    //   create: () =>
    //     createCube(
    //       ctx,
    //       createRemoteStandardMaterial(ctx, {
    //         baseColorFactor: [0, 1, 0, 1.0],
    //         roughnessFactor: 0.8,
    //         metallicFactor: 0.8,
    //       })
    //     ),
    // });

    // registerPrefab(ctx, {
    //   name: "blue-cube",
    //   create: () =>
    //     createCube(
    //       ctx,
    //       createRemoteStandardMaterial(ctx, {
    //         baseColorFactor: [0, 0, 1, 1.0],
    //         roughnessFactor: 0.8,
    //         metallicFactor: 0.8,
    //       })
    //     ),
    // });

    // registerPrefab(ctx, {
    //   name: "player-cube",
    //   create: () =>
    //     createCube(
    //       ctx,
    //       createRemoteStandardMaterial(ctx, {
    //         baseColorFactor: [1, 1, 1, 1.0],
    //         roughnessFactor: 0.1,
    //         metallicFactor: 0.9,
    //       })
    //     ),
    // });

    registerPrefab(ctx, {
      name: "mixamo-x",
      create: () => {
        return createContainerizedAvatar(ctx, "/gltf/full-animation-rig.glb");
      },
    });

    registerPrefab(ctx, {
      name: "mixamo-y",
      create: () => {
        return createContainerizedAvatar(ctx, "/gltf/full-animation-rig.glb");
      },
    });

    // await waitForRemoteResource(ctx, environmentMapTexture.resourceId);

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

async function onLoadWorld(ctx: GameState, message: LoadWorldMessage) {
  try {
    await loadEnvironment(ctx, message.url);
    loadPreviewCamera(ctx);

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

async function onEnterWorld(ctx: GameState, message: EnterWorldMessage) {
  const network = getModule(ctx, NetworkModule);
  await waitUntil(() => network.peerIdToIndex.has(network.peerId));
  loadPlayerRig(ctx);
}

function onExitWorld(ctx: GameState, message: ExitWorldMessage) {
  const thirdroom = getModule(ctx, ThirdRoomModule);

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
    await loadEnvironment(ctx, message.url, message.fileMap);
    loadPlayerRig(ctx);
  } catch (error) {
    console.error(error);

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

  const environmentMapTexture = createRemoteTexture(ctx, {
    name: "Environment Map Texture",
    image: createRemoteImage(ctx, { name: "Environment Map Image", uri: "/cubemap/venice_sunset_1k.hdr" }),
    sampler: createRemoteSampler(ctx, {
      mapping: SamplerMapping.EquirectangularReflectionMapping,
    }),
  });

  const sceneGltf = await inflateGLTFScene(ctx, newScene, url, { fileMap });

  thirdroom.sceneGLTF = sceneGltf;

  const newSceneResource = RemoteSceneComponent.get(newScene)!;

  newSceneResource.backgroundTexture = environmentMapTexture;
  newSceneResource.environmentTexture = environmentMapTexture;

  ctx.activeScene = newScene;

  // Temp hack for city scene
  if (
    sceneGltf.root.scenes &&
    sceneGltf.root.scenes.length > 0 &&
    sceneGltf.root.scenes[0].name === "SampleSceneDay 1"
  ) {
    const collisionGeo = addEntity(ctx.world);
    thirdroom.collisionsGLTF = await inflateGLTFScene(ctx, collisionGeo, "/gltf/city/CityCollisions.glb");
    addChild(newScene, collisionGeo);
  }
}

const spawnPointQuery = defineQuery([SpawnPoint]);

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

function loadPlayerRig(ctx: GameState) {
  const spawnPoints = spawnPointQuery(ctx.world);

  if (ctx.activeCamera) {
    removeRecursive(ctx.world, ctx.activeCamera);
  }

  const characterControllerType = SceneCharacterControllerComponent.get(ctx.activeScene)?.type;

  let playerRig: number;

  if (characterControllerType === CharacterControllerType.Fly || spawnPoints.length === 0) {
    playerRig = createFlyPlayerRig(ctx);
  } else {
    playerRig = createPlayerRig(ctx);
  }

  if (spawnPoints.length > 0) {
    const spawnPointIndex = Math.foor(Math.random() * (spawnPoints.length - 1));
    const worldMatrix = Transform.worldMatrix[spawnPoints[spawnPointIndex]];
    const worldPosition = mat4.getTranslation(vec3.create(), worldMatrix);
    const worldQuaternion = mat4.getRotation(quat.create(), worldMatrix);

    vec3.copy(Transform.position[playerRig], worldPosition);
    Transform.position[playerRig][1] += 1.6;
    setEulerFromQuaternion(Transform.rotation[playerRig], worldQuaternion);
    Transform.rotation[playerRig][0] = 0;
    Transform.rotation[playerRig][2] = 0;
    setQuaternionFromEuler(Transform.quaternion[playerRig], Transform.rotation[playerRig]);
  }

  addChild(ctx.activeScene, playerRig);
}

const waitUntil = (fn: Function) =>
  new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (fn()) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
