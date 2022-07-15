import { addEntity, defineQuery } from "bitecs";
import { vec3 } from "gl-matrix";

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
        return createContainerizedAvatar(ctx, "/gltf/mixamo-x-noanim.glb");
      },
    });

    registerPrefab(ctx, {
      name: "mixamo-y",
      create: () => {
        return createContainerizedAvatar(ctx, "/gltf/mixamo-y-noanim.glb");
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
  const thirdroom = getModule(ctx, ThirdRoomModule);

  try {
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

    const sceneGltf = await inflateGLTFScene(ctx, newScene, message.url);

    thirdroom.sceneGLTF = sceneGltf;

    const newSceneResource = RemoteSceneComponent.get(newScene)!;

    newSceneResource.backgroundTexture = environmentMapTexture;
    newSceneResource.environmentTexture = environmentMapTexture;

    let defaultCamera = NOOP;

    if (!ctx.activeCamera) {
      defaultCamera = addEntity(ctx.world);

      addTransformComponent(ctx.world, defaultCamera);

      addChild(newScene, defaultCamera);

      addRemoteNodeComponent(ctx, defaultCamera, {
        camera: createRemotePerspectiveCamera(ctx),
      });

      ctx.activeCamera = defaultCamera;
    }

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

    const spawnPoints = spawnPointQuery(ctx.world);

    if (ctx.activeCamera === defaultCamera && spawnPoints.length > 0) {
      vec3.copy(Transform.position[defaultCamera], Transform.position[spawnPoints[0]]);
      Transform.position[defaultCamera][1] += 1.6;
      vec3.copy(Transform.quaternion[defaultCamera], Transform.quaternion[spawnPoints[0]]);
      setEulerFromQuaternion(Transform.rotation[defaultCamera], Transform.quaternion[defaultCamera]);
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

const spawnPointQuery = defineQuery([SpawnPoint]);

async function onEnterWorld(state: GameState, message: EnterWorldMessage) {
  const { world } = state;

  const network = getModule(state, NetworkModule);

  await waitUntil(() => network.peerIdToIndex.has(network.peerId));

  const spawnPoints = spawnPointQuery(world);

  if (state.activeCamera) {
    removeRecursive(world, state.activeCamera);
  }

  const characterControllerType = SceneCharacterControllerComponent.get(state.activeScene)?.type;

  let playerRig: number;

  if (characterControllerType === CharacterControllerType.Fly || spawnPoints.length === 0) {
    playerRig = createFlyPlayerRig(state);
  } else {
    playerRig = createPlayerRig(state);
  }

  if (spawnPoints.length > 0) {
    vec3.copy(Transform.position[playerRig], Transform.position[spawnPoints[0]]);
    vec3.copy(Transform.quaternion[playerRig], Transform.quaternion[spawnPoints[0]]);
    setEulerFromQuaternion(Transform.rotation[playerRig], Transform.quaternion[playerRig]);
  }

  addChild(state.activeScene, playerRig);
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

const waitUntil = (fn: Function) =>
  new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (fn()) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
