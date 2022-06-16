import { addEntity, defineComponent, defineQuery, removeEntity } from "bitecs";
import { vec3 } from "gl-matrix";

import { SpawnPoint } from "../../engine/component/SpawnPoint";
import { addChild, setEulerFromQuaternion, setQuaternionFromEuler, Transform } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../../engine/module/module.common";
import { NetworkModule } from "../../engine/network/network.game";
import { createPlayerRig } from "../PhysicsCharacterController";
import { EnterWorldMessage, ExitWorldMessage, LoadEnvironmentMessage, ThirdRoomMessageType } from "./thirdroom.common";
//import { waitForRemoteResource } from "../../engine/resource/resource.game";
import { createRemoteImage } from "../../engine/image/image.game";
import { createRemoteTexture } from "../../engine/texture/texture.game";
import { RemoteSceneComponent } from "../../engine/scene/scene.game";
//import { addGLTFLoaderComponent } from "../../gltf/gltf.game";
import { createRemoteSampler } from "../../engine/sampler/sampler.game";
import { SamplerMapping } from "../../engine/sampler/sampler.common";
import { inflateGLTFScene } from "../../engine/gltf/gltf.game";
// import { createCube, createRotatedAvatar, registerPrefab } from "../../engine/prefab";
// import { createRemoteStandardMaterial } from "../../engine/material/material.game";
// import {
//   createRemoteAudio,
//   createRemoteAudioSource,
//   createRemotePositionalAudioEmitter,
// } from "../../engine/audio/audio.game";
// import { RemoteNodeComponent } from "../../engine/node/node.game";

interface ThirdRoomModuleState {
  environment?: number;
}

const SpinnyCube = defineComponent();

const spinnyCubeQuery = defineQuery([SpinnyCube]);

export function SpinnyCubeSystem(ctx: GameState) {
  const entities = spinnyCubeQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const quaternion = Transform.quaternion[eid];
    const rotation = Transform.rotation[eid];

    rotation[1] += ctx.dt * 0.5;

    setQuaternionFromEuler(quaternion, rotation);
  }
}

export const ThirdRoomModule = defineModule<GameState, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {};
  },
  async init(ctx) {
    const disposables = [
      registerMessageHandler(ctx, ThirdRoomMessageType.LoadEnvironment, onLoadEnvironment),
      registerMessageHandler(ctx, ThirdRoomMessageType.EnterWorld, onEnterWorld),
      registerMessageHandler(ctx, ThirdRoomMessageType.ExitWorld, onExitWorld),
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

    // registerPrefab(ctx, {
    //   name: "mixamo-x",
    //   create: () => {
    //     return createRotatedAvatar(ctx, "/gltf/mixamo-x.glb");
    //   },
    // });

    // registerPrefab(ctx, {
    //   name: "mixamo-y",
    //   create: () => {
    //     return createRotatedAvatar(ctx, "/gltf/mixamo-y.glb");
    //   },
    // });

    // await waitForRemoteResource(ctx, environmentMapTexture.resourceId);

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

async function onLoadEnvironment(ctx: GameState, message: LoadEnvironmentMessage) {
  const thirdroom = getModule(ctx, ThirdRoomModule);

  if (thirdroom.environment) {
    // TODO: Clean up scene
    removeEntity(ctx.world, ctx.activeScene);
  }

  const newScene = addEntity(ctx.world);

  const environmentMap = createRemoteImage(ctx, "/cubemap/venice_sunset_1k.hdr");
  const environmentMapTexture = createRemoteTexture(ctx, environmentMap, {
    sampler: createRemoteSampler(ctx, {
      mapping: SamplerMapping.EquirectangularReflectionMapping,
    }),
  });

  await inflateGLTFScene(ctx, newScene, message.url);

  const newSceneResource = RemoteSceneComponent.get(newScene)!;

  newSceneResource.backgroundTexture = environmentMapTexture;
  newSceneResource.environmentTexture = environmentMapTexture;

  ctx.activeScene = newScene;
}

let playerRig: number;

const spawnPointQuery = defineQuery([SpawnPoint]);

async function onEnterWorld(state: GameState, message: EnterWorldMessage) {
  const { world } = state;

  const network = getModule(state, NetworkModule);

  await waitUntil(() => network.peerIdToIndex.has(network.peerId));

  const spawnPoints = spawnPointQuery(world);

  playerRig = createPlayerRig(state);
  vec3.copy(Transform.position[playerRig], Transform.position[spawnPoints[0]]);
  vec3.copy(Transform.quaternion[playerRig], Transform.quaternion[spawnPoints[0]]);
  setEulerFromQuaternion(Transform.rotation[playerRig], Transform.quaternion[playerRig]);

  addChild(state.activeScene, playerRig);
}

function onExitWorld(state: GameState, message: ExitWorldMessage) {}

const waitUntil = (fn: Function) =>
  new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (fn()) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
