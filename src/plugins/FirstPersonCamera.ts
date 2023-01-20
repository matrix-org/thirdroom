import { addComponent, defineComponent, defineQuery, Types } from "bitecs";
import { vec2, glMatrix as glm, quat } from "gl-matrix";

import {
  createCursorView,
  readFloat32,
  readUint32,
  sliceCursorView,
  writeFloat32,
  writeUint32,
} from "../engine/allocator/CursorView";
import { getCamera } from "../engine/camera/camera.game";
import { Axes } from "../engine/component/transform";
import { ourPlayerQuery } from "../engine/component/Player";
import { GameState, World } from "../engine/GameTypes";
import { enableActionMap, ActionMap, ActionType, BindingType } from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { tryGetInputController, InputController } from "../engine/input/InputController";
import { defineModule, getModule } from "../engine/module/module.common";
import { registerInboundMessageHandler } from "../engine/network/inbound.game";
import { isHost } from "../engine/network/network.common";
import { Networked, NetworkModule } from "../engine/network/network.game";
import { NetworkAction } from "../engine/network/NetworkAction";
import { sendReliable } from "../engine/network/outbound.game";
import { NetPipeData, writeMetadata } from "../engine/network/serialization.game";
import { getRemoteResource, tryGetRemoteResource } from "../engine/resource/resource.game";
import { RemoteNode } from "../engine/resource/RemoteResources";
import { maxEntities } from "../engine/config.common";

type FirstPersonCameraModuleState = {};

export const FirstPersonCameraModule = defineModule<GameState, FirstPersonCameraModuleState>({
  name: "first-person-camera",
  create() {
    return {};
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);
    const controller = input.defaultController;
    enableActionMap(controller, FirstPersonCameraActionMap);

    const network = getModule(ctx, NetworkModule);
    registerInboundMessageHandler(network, NetworkAction.UpdateCamera, deserializeUpdateCamera);
  },
});

const MESSAGE_SIZE = Uint8Array.BYTES_PER_ELEMENT + Uint32Array.BYTES_PER_ELEMENT + 10 * Float32Array.BYTES_PER_ELEMENT;
const messageView = createCursorView(new ArrayBuffer(100 * MESSAGE_SIZE));

export function createUpdateCameraMessage(ctx: GameState, eid: number, camera: number) {
  const data: NetPipeData = [ctx, messageView, ""];

  const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
  const cameraNode = tryGetRemoteResource<RemoteNode>(ctx, camera);

  writeMetadata(NetworkAction.UpdateCamera)(data);

  writeUint32(messageView, Networked.networkId[eid]);

  writeFloat32(messageView, node.quaternion[0]);
  writeFloat32(messageView, node.quaternion[1]);
  writeFloat32(messageView, node.quaternion[2]);
  writeFloat32(messageView, node.quaternion[3]);

  writeFloat32(messageView, cameraNode.quaternion[0]);
  writeFloat32(messageView, cameraNode.quaternion[1]);
  writeFloat32(messageView, cameraNode.quaternion[2]);
  writeFloat32(messageView, cameraNode.quaternion[3]);

  return sliceCursorView(messageView);
}

function deserializeUpdateCamera(data: NetPipeData) {
  const [ctx, view] = data;

  // TODO: put network ref in the net pipe data
  const network = getModule(ctx, NetworkModule);

  const nid = readUint32(view);
  const player = network.networkIdToEntityId.get(nid)!;
  const node = tryGetRemoteResource<RemoteNode>(ctx, player);

  const camera = getCamera(ctx, node);

  node.quaternion[0] = readFloat32(view);
  node.quaternion[1] = readFloat32(view);
  node.quaternion[2] = readFloat32(view);
  node.quaternion[3] = readFloat32(view);

  camera.quaternion[0] = readFloat32(view);
  camera.quaternion[1] = readFloat32(view);
  camera.quaternion[2] = readFloat32(view);
  camera.quaternion[3] = readFloat32(view);

  return data;
}

export const FirstPersonCameraActions = {
  Look: "FirstPersonCamera/Look",
};

export const FirstPersonCameraActionMap: ActionMap = {
  id: "first-person-camera",
  actionDefs: [
    {
      id: "look",
      path: FirstPersonCameraActions.Look,
      type: ActionType.Vector2,
      bindings: [
        {
          type: BindingType.Axes,
          x: "Mouse/movementX",
          y: "Mouse/movementY",
        },
      ],
    },
  ],
};

export const FirstPersonCameraPitchTarget = defineComponent(
  {
    pitch: Types.f32,
    maxAngle: Types.f32,
    minAngle: Types.f32,
    sensitivity: Types.f32,
  },
  maxEntities
);
export const FirstPersonCameraYawTarget = defineComponent(
  {
    sensitivity: Types.f32,
  },
  maxEntities
);

const DEFAULT_SENSITIVITY = 100;

export function addCameraPitchTargetComponent(world: World, node: RemoteNode) {
  const eid = node.eid;
  addComponent(world, FirstPersonCameraPitchTarget, eid);
  FirstPersonCameraPitchTarget.maxAngle[eid] = 89;
  FirstPersonCameraPitchTarget.minAngle[eid] = -89;
  FirstPersonCameraPitchTarget.sensitivity[eid] = DEFAULT_SENSITIVITY;
}

export function addCameraYawTargetComponent(world: World, node: RemoteNode) {
  addComponent(world, FirstPersonCameraYawTarget, node.eid);
  FirstPersonCameraYawTarget.sensitivity[node.eid] = DEFAULT_SENSITIVITY;
}

export const cameraPitchTargetQuery = defineQuery([FirstPersonCameraPitchTarget, RemoteNode]);
export const cameraYawTargetQuery = defineQuery([FirstPersonCameraYawTarget, RemoteNode]);

function applyYaw(ctx: GameState, controller: InputController, node: RemoteNode) {
  const [lookX] = controller.actionStates.get(FirstPersonCameraActions.Look) as vec2;

  if (Math.abs(lookX) >= 1) {
    const sensitivity = FirstPersonCameraYawTarget.sensitivity[node.eid] || 1;
    const quaternion = node.quaternion;
    quat.rotateY(quaternion, quaternion, -(lookX / (1000 / (sensitivity || 1))) * ctx.dt);
  }
}

function applyPitch(ctx: GameState, controller: InputController, node: RemoteNode) {
  const [, lookY] = controller.actionStates.get(FirstPersonCameraActions.Look) as vec2;

  if (Math.abs(lookY) >= 1) {
    const eid = node.eid;
    let pitch = FirstPersonCameraPitchTarget.pitch[eid];
    const sensitivity = FirstPersonCameraPitchTarget.sensitivity[eid] || DEFAULT_SENSITIVITY;
    const maxAngle = FirstPersonCameraPitchTarget.maxAngle[eid];
    const minAngle = FirstPersonCameraPitchTarget.minAngle[eid];
    const maxAngleRads = glm.toRadian(maxAngle || 89);
    const minAngleRads = glm.toRadian(minAngle || -89);
    pitch -= (lookY / (1000 / (sensitivity || 1))) * ctx.dt;

    if (pitch > maxAngleRads) {
      pitch = maxAngleRads;
    } else if (pitch < minAngleRads) {
      pitch = minAngleRads;
    }

    FirstPersonCameraPitchTarget.pitch[eid] = pitch;

    quat.setAxisAngle(node.quaternion, Axes.X, pitch);
  }
}

export function FirstPersonCameraSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  if (network.authoritative && !isHost(network) && !network.clientSidePrediction) {
    return;
  }

  const input = getModule(ctx, InputModule);

  const pitchEntities = cameraPitchTargetQuery(ctx.world);
  for (let i = 0; i < pitchEntities.length; i++) {
    const eid = pitchEntities[i];
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    // pitch target on camera, controller is on the parent of the parent of the camera
    const cameraAnchor = node.parent!.parent!;
    const container = cameraAnchor.parent;

    if (!container) {
      continue;
    }

    const controller = tryGetInputController(input, container.eid);
    applyPitch(ctx, controller, node);
  }

  const yawEntities = cameraYawTargetQuery(ctx.world);
  for (let i = 0; i < yawEntities.length; i++) {
    const eid = yawEntities[i];
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const controller = tryGetInputController(input, eid);
    applyYaw(ctx, controller, node);
  }
}

export function NetworkedFirstPersonCameraSystem(ctx: GameState) {
  const ourPlayer = ourPlayerQuery(ctx.world)[0];
  const playerNode = getRemoteResource<RemoteNode>(ctx, ourPlayer);
  const network = getModule(ctx, NetworkModule);

  if (!network.authoritative || !ourPlayer || !playerNode) {
    return;
  }

  const haveConnectedPeers = network.peers.length > 0;
  const hosting = network.authoritative && isHost(network);
  if (hosting || !haveConnectedPeers) {
    return;
  }

  const camera = getCamera(ctx, playerNode);
  const msg = createUpdateCameraMessage(ctx, ourPlayer, camera.eid);
  if (msg.byteLength > 0) {
    sendReliable(ctx, network, network.hostId, msg);
  }
}
