import { addComponent, defineComponent, defineQuery, hasComponent, Types } from "bitecs";
import { vec2, glMatrix as glm, quat, vec3 } from "gl-matrix";

import {
  createCursorView,
  readFloat32,
  readUint32,
  sliceCursorView,
  writeFloat32,
  writeUint32,
} from "../engine/allocator/CursorView";
import { getCamera } from "../engine/camera/camera.game";
import { GameState, World } from "../engine/GameTypes";
import { enableActionMap, ActionMap, ActionType, BindingType } from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { getInputController, InputController } from "../engine/input/InputController";
import { defineModule, getModule } from "../engine/module/module.common";
import { registerInboundMessageHandler } from "../engine/network/inbound.game";
import { isHost } from "../engine/network/network.common";
import { Networked, NetworkModule, Owned } from "../engine/network/network.game";
import { NetworkAction } from "../engine/network/NetworkAction";
import { broadcastReliable } from "../engine/network/outbound.game";
import { NetPipeData, writeMetadata } from "../engine/network/serialization.game";
import { RemoteNodeComponent } from "../engine/node/node.game";
import { RemoteNode } from "../engine/resource/schema";
import { getAvatar } from "./avatars/getAvatar";

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
  writeMetadata(NetworkAction.UpdateCamera)(data);
  writeUint32(messageView, Networked.networkId[eid]);
  const cameraNode = RemoteNodeComponent.get(camera)!;
  const pitch = quat.getAxisAngle(xAxis, cameraNode.quaternion);
  writeFloat32(messageView, pitch);
  return sliceCursorView(messageView);
}

const xAxis = vec3.fromValues(1, 0, 0);

function deserializeUpdateCamera(data: NetPipeData) {
  const [ctx, view] = data;

  // TODO: put network ref in the net pipe data
  const network = getModule(ctx, NetworkModule);

  const avatarNid = readUint32(view);
  const avatar = network.networkIdToEntityId.get(avatarNid)!;
  const avatarNode = RemoteNodeComponent.get(avatar)!;
  const camera = getCamera(ctx, avatarNode);
  const pitch = readFloat32(view);
  quat.setAxisAngle(camera.quaternion, xAxis, pitch);
  return data;
}

export const FirstPersonCameraActions = {
  Look: "FirstPersonCamera/Look",
};

export const FirstPersonCameraActionMap: ActionMap = {
  id: "first-person-camera",
  actions: [
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

export const FirstPersonCameraPitchTarget = defineComponent({
  pitch: Types.f32,
  maxAngle: Types.f32,
  minAngle: Types.f32,
  sensitivity: Types.f32,
});
export const FirstPersonCameraYawTarget = defineComponent({
  sensitivity: Types.f32,
});

const DEFAULT_SENSITIVITY = 100;

export function addCameraPitchTargetComponent(world: World, camera: RemoteNode) {
  const eid = camera.resourceId;
  addComponent(world, FirstPersonCameraPitchTarget, eid);
  FirstPersonCameraPitchTarget.maxAngle[eid] = 89;
  FirstPersonCameraPitchTarget.minAngle[eid] = -89;
  FirstPersonCameraPitchTarget.sensitivity[eid] = DEFAULT_SENSITIVITY;
}

export function addCameraYawTargetComponent(world: World, eid: number) {
  addComponent(world, FirstPersonCameraYawTarget, eid);
  FirstPersonCameraYawTarget.sensitivity[eid] = DEFAULT_SENSITIVITY;
}

export const cameraPitchTargetQuery = defineQuery([FirstPersonCameraPitchTarget, RemoteNodeComponent]);
export const cameraYawTargetQuery = defineQuery([FirstPersonCameraYawTarget, RemoteNodeComponent]);

function applyYaw(ctx: GameState, controller: InputController, eid: number) {
  const [lookX] = controller.actions.get(FirstPersonCameraActions.Look) as vec2;

  if (Math.abs(lookX) >= 1) {
    const sensitivity = FirstPersonCameraYawTarget.sensitivity[eid] || 1;
    const quaternion = RemoteNodeComponent.get(eid)!.quaternion;
    quat.rotateY(quaternion, quaternion, -(lookX / (1000 / (sensitivity || 1))) * ctx.dt);
  }
}

function applyPitch(ctx: GameState, controller: InputController, eid: number) {
  const [, lookY] = controller.actions.get(FirstPersonCameraActions.Look) as vec2;

  if (Math.abs(lookY) >= 1) {
    const node = RemoteNodeComponent.get(eid)!;

    const sensitivity = FirstPersonCameraPitchTarget.sensitivity[eid] || DEFAULT_SENSITIVITY;
    const maxAngle = FirstPersonCameraPitchTarget.maxAngle[eid];
    const minAngle = FirstPersonCameraPitchTarget.minAngle[eid];
    const maxAngleRads = glm.toRadian(maxAngle || 89);
    const minAngleRads = glm.toRadian(minAngle || -89);

    let pitch = FirstPersonCameraPitchTarget.pitch[eid];

    pitch -= (lookY / (1000 / (sensitivity || 1))) * ctx.dt;

    if (pitch > maxAngleRads) {
      pitch = maxAngleRads;
    } else if (pitch < minAngleRads) {
      pitch = minAngleRads;
    }

    FirstPersonCameraPitchTarget.pitch[eid] = pitch;

    quat.setAxisAngle(node.quaternion, xAxis, pitch);
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
    const node = RemoteNodeComponent.get(eid)!;
    // pitch target on camera, controller is on the parent of the camera
    const parent = node.parent as RemoteNode;
    const parentEid = parent.resourceId;
    const controller = getInputController(input, parentEid);
    applyPitch(ctx, controller, eid);

    // network the avatar's camera
    const haveConnectedPeers = network.peers.length > 0;
    const hosting = network.authoritative && isHost(network);
    const avatar = getAvatar(ctx, parent);
    const isOwnedAvatar =
      avatar && hasComponent(ctx.world, Networked, parentEid) && hasComponent(ctx.world, Owned, parentEid);
    if (hosting && haveConnectedPeers && isOwnedAvatar) {
      const camera = getCamera(ctx, parent);
      const msg = createUpdateCameraMessage(ctx, parentEid, camera.resourceId);
      if (msg.byteLength > 0) {
        broadcastReliable(ctx, network, msg);
      }
    }
  }

  const yawEntities = cameraYawTargetQuery(ctx.world);
  for (let i = 0; i < yawEntities.length; i++) {
    const eid = yawEntities[i];
    const controller = getInputController(input, eid);
    applyYaw(ctx, controller, eid);
  }
}
