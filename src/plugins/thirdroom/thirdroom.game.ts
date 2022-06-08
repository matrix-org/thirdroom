import { addEntity, defineQuery } from "bitecs";
import { vec3 } from "gl-matrix";

import { SpawnPoint } from "../../engine/component/SpawnPoint";
import { addChild, setEulerFromQuaternion, Transform } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../../engine/module/module.common";
import { NetworkModule } from "../../engine/network/network.game";
import { createPlayerRig } from "../PhysicsCharacterController";
import { EnterWorldMessage, ExitWorldMessage, LoadEnvironmentMessage, ThirdRoomMessageType } from "./thirdroom.common";
import { getActiveScene } from "../../engine/renderer/renderer.game";
import { waitForRemoteResource } from "../../engine/resource/resource.game";
import { createRemoteImage } from "../../engine/image/image.game";
import { createRemoteTexture } from "../../engine/texture/texture.game";
import { RemoteSceneComponent } from "../../engine/scene/scene.game";
import { addGLTFLoaderComponent } from "../../gltf/gltf.game";

interface ThirdRoomModuleState {
  environment?: number;
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

    const scene = getActiveScene(ctx);
    const sceneResource = RemoteSceneComponent.get(scene)!;

    const environmentMap = createRemoteImage(ctx, "/cubemap/venice_sunset_1k.hdr");
    const environmentMapTexture = createRemoteTexture(ctx, environmentMap);

    sceneResource.background = environmentMapTexture;
    sceneResource.environment = environmentMapTexture;

    await waitForRemoteResource(ctx, environmentMapTexture.resourceId);

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

function onLoadEnvironment(ctx: GameState, message: LoadEnvironmentMessage) {
  const thirdroom = getModule(ctx, ThirdRoomModule);

  if (thirdroom.environment) {
    // removeEntity(ctx.world, thirdroom.environment);
  }

  const scene = getActiveScene(ctx);
  const environment = addEntity(ctx.world);
  addChild(scene, environment);
  addGLTFLoaderComponent(ctx, environment, message.url);
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

  const scene = getActiveScene(state);
  addChild(scene, playerRig);
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
