import { defineQuery } from "bitecs";
import { vec3 } from "gl-matrix";

import { SpawnPoint } from "../../engine/component/SpawnPoint";
import { addChild, setEulerFromQuaternion, Transform } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../../engine/module/module.common";
import { NetworkModule } from "../../engine/network/network.game";
import { createRGBETexture } from "../../engine/texture/texture.game";
import { createPlayerRig } from "../PhysicsCharacterController";
import { EnterWorldMessage, ExitWorldMessage, LoadEnvironmentMessage, ThirdRoomMessageType } from "./thirdroom.common";
import { createScene } from "../../engine/scene/scene.game";
import { createGLTFEntity } from "../../engine/gltf/GLTFLoader";

interface ThirdRoomModuleState {
  environment?: number;
}

let sceneResource: any;

export const ThirdRoomModule = defineModule<GameState, ThirdRoomModuleState>({
  name: "thirdroom",
  create() {
    return {};
  },
  init(ctx) {
    const disposables = [
      registerMessageHandler(ctx, ThirdRoomMessageType.LoadEnvironment, onLoadEnvironment),
      registerMessageHandler(ctx, ThirdRoomMessageType.EnterWorld, onEnterWorld),
      registerMessageHandler(ctx, ThirdRoomMessageType.ExitWorld, onExitWorld),
    ];

    // TODO: Create initial scene resource on thread context
    sceneResource = createScene(ctx, {});

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

  createGLTFEntity(ctx, message.url, ctx.scene);
}

let playerRig: number;

const spawnPointQuery = defineQuery([SpawnPoint]);

async function onEnterWorld(state: GameState, message: EnterWorldMessage) {
  const { scene, world } = state;

  const network = getModule(state, NetworkModule);

  await waitUntil(() => network.peerIdToIndex.has(network.peerId));

  const spawnPoints = spawnPointQuery(world);

  playerRig = createPlayerRig(state);
  vec3.copy(Transform.position[playerRig], Transform.position[spawnPoints[0]]);
  vec3.copy(Transform.quaternion[playerRig], Transform.quaternion[spawnPoints[0]]);
  setEulerFromQuaternion(Transform.rotation[playerRig], Transform.quaternion[playerRig]);
  addChild(scene, playerRig);

  const environmentMapTexture = createRGBETexture(state, {
    name: "Environment Map",
    uri: "/cubemap/venice_sunset_1k.hdr",
  });

  sceneResource.background = environmentMapTexture;
  sceneResource.environment = environmentMapTexture;
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
