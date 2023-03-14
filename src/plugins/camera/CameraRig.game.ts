import { addComponent, defineQuery, exitQuery, hasComponent, Query } from "bitecs";
import { vec2, glMatrix as glm, quat, vec3, mat4 } from "gl-matrix";

import { Axes, clamp } from "../../engine/component/math";
import { GameState, World } from "../../engine/GameTypes";
import { enableActionMap } from "../../engine/input/ActionMappingSystem";
import { ActionMap, ActionType, BindingType, ButtonActionState } from "../../engine/input/ActionMap";
import { InputModule } from "../../engine/input/input.game";
import {
  addInputController,
  createInputController,
  InputController,
  inputControllerQuery,
  setActiveInputController,
  tryGetInputController,
} from "../../engine/input/InputController";
import { defineModule, getModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { getRemoteResource, tryGetRemoteResource } from "../../engine/resource/resource.game";
import { addObjectToWorld, RemoteNode, removeObjectFromWorld } from "../../engine/resource/RemoteResources";
import { addChild } from "../../engine/component/transform";
import { createRemotePerspectiveCamera, getCamera } from "../../engine/camera/camera.game";
import { ThirdPersonComponent } from "./../thirdroom/thirdroom.game";
import { CameraRigMessage } from "./CameraRig.common";
import { ourPlayerQuery } from "../../engine/component/Player";
import { embodyAvatar, NetPipeData, writeMetadata } from "../../engine/network/serialization.game";
import { PhysicsModule } from "../../engine/physics/physics.game";
import { NetworkModule } from "../../engine/network/network.game";
import { isHost } from "../../engine/network/network.common";
import { sendReliable } from "../../engine/network/outbound.game";
import { registerInboundMessageHandler } from "../../engine/network/inbound.game";
import { NetworkAction } from "../../engine/network/NetworkAction";
import {
  createCursorView,
  writeUint32,
  writeFloat32,
  sliceCursorView,
  readUint32,
  readFloat32,
} from "../../engine/allocator/CursorView";
import { Networked } from "../../engine/network/NetworkComponents";
import { createDisposables } from "../../engine/utils/createDisposables";
import { ThirdRoomMessageType } from "../thirdroom/thirdroom.common";
import { sendInteractionMessage } from "../interaction/interaction.game";
import { InteractableAction } from "../interaction/interaction.common";

export const CameraRigModule = defineModule<GameState, { orbiting: boolean }>({
  name: "camera-rig-module",
  create() {
    return { orbiting: false };
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);
    const controller = input.defaultController;
    enableActionMap(controller, CameraRigActionMap);

    const network = getModule(ctx, NetworkModule);
    registerInboundMessageHandler(network, NetworkAction.UpdateCamera, deserializeUpdateCamera);

    const module = getModule(ctx, CameraRigModule);
    return createDisposables([
      registerMessageHandler(ctx, ThirdRoomMessageType.ExitWorld, () => {
        module.orbiting = false;
      }),
    ]);
  },
});

export const CameraRigAction = {
  LookMovement: "CameraRig/LookMovement",
  ScreenPosition: "CameraRig/ScreenPosition",
  LeftMouse: "CameraRig/LeftMouse",
  Zoom: "CameraRig/Zoom",
  ExitOrbit: "CameraRig/ExitOrbit",
};

export const CameraRigActionMap: ActionMap = {
  id: "camera-rig",
  actionDefs: [
    {
      id: "left-mouse",
      path: CameraRigAction.LeftMouse,
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Mouse/Left",
        },
      ],
    },
    {
      id: "zoom",
      path: CameraRigAction.Zoom,
      type: ActionType.Vector2,
      bindings: [
        {
          type: BindingType.Axes,
          y: "Mouse/Scroll",
        },
      ],
    },
    {
      id: "look",
      path: CameraRigAction.LookMovement,
      type: ActionType.Vector2,
      bindings: [
        {
          type: BindingType.Axes,
          x: "Mouse/movementX",
          y: "Mouse/movementY",
        },
      ],
    },
    {
      id: "exit-orbit",
      path: CameraRigAction.ExitOrbit,
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/Escape",
        },
      ],
    },
  ],
};

export enum CameraRigType {
  Orbit,
  PointerLock,
}
export interface PitchComponent {
  type: CameraRigType;
  target: number;
  pitch: number;
  maxAngle: number;
  minAngle: number;
  sensitivity: number;
}
export interface YawComponent {
  type: CameraRigType;
  target: number;
  sensitivity: number;
}
export interface ZoomComponent {
  type: CameraRigType;
  target: number;
  min: number;
  max: number;
}
export interface OrbitAnchor {
  target: number;
}

// Components
export const PitchComponent = new Map<number, PitchComponent>();
export const YawComponent = new Map<number, YawComponent>();
export const ZoomComponent = new Map<number, ZoomComponent>();
export const OrbitAnchor = new Map<number, OrbitAnchor>();

// Queries
export const pitchQuery = defineQuery([PitchComponent]);
export const exitPitchQuery = exitQuery(pitchQuery);

export const yawQuery = defineQuery([YawComponent]);
export const exitYawQuery = exitQuery(yawQuery);

export const zoomQuery = defineQuery([ZoomComponent]);
export const exitZoomQuery = exitQuery(zoomQuery);

export const orbitAnchorQuery = defineQuery([OrbitAnchor]);
export const exitOrbitAnchorQuery = exitQuery(orbitAnchorQuery);

// Constants
const DEFAULT_SENSITIVITY = 100;

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 10;

export function startOrbit(ctx: GameState, nodeToOrbit: RemoteNode) {
  const input = getModule(ctx, InputModule);
  const camRigModule = getModule(ctx, CameraRigModule);

  camRigModule.orbiting = true;

  const orbitAnchor = new RemoteNode(ctx.resourceManager);
  addOrbitAnchor(ctx.world, orbitAnchor, nodeToOrbit);

  addObjectToWorld(ctx, orbitAnchor);

  const controller = createInputController(input.defaultController);
  addInputController(ctx.world, input, controller, orbitAnchor.eid);
  setActiveInputController(input, orbitAnchor.eid);

  const [camera] = addCameraRig(ctx, orbitAnchor, CameraRigType.Orbit);

  camera.position[2] = 6;

  ctx.worldResource.activeCameraNode = camera;

  ctx.sendMessage(Thread.Main, { type: CameraRigMessage.StartOrbit });

  sendInteractionMessage(ctx, InteractableAction.Unfocus);
}

export function stopOrbit(ctx: GameState) {
  const input = getModule(ctx, InputModule);
  const physics = getModule(ctx, PhysicsModule);
  const camRigModule = getModule(ctx, CameraRigModule);

  camRigModule.orbiting = false;

  orbitAnchorQuery(ctx.world).forEach((eid) => {
    const orbitAnchorNode = tryGetRemoteResource<RemoteNode>(ctx, eid);
    removeObjectFromWorld(ctx, orbitAnchorNode);
  });

  const ourPlayer = ourPlayerQuery(ctx.world)[0];
  const node = tryGetRemoteResource<RemoteNode>(ctx, ourPlayer);
  embodyAvatar(ctx, physics, input, node);

  ctx.sendMessage(Thread.Main, { type: CameraRigMessage.StopOrbit });
}

export function addCameraRig(
  ctx: GameState,
  node: RemoteNode,
  type: CameraRigType,
  anchorOffset?: vec3
): [RemoteNode, PitchComponent, YawComponent, ZoomComponent] {
  // add camera anchor
  const cameraAnchor = new RemoteNode(ctx.resourceManager);
  cameraAnchor.name = "Camera Anchor";

  if (anchorOffset) cameraAnchor.position.set(anchorOffset);

  // add camera
  const camera = new RemoteNode(ctx.resourceManager, {
    camera: createRemotePerspectiveCamera(ctx),
  });

  // add hierarchy
  addChild(node, cameraAnchor);
  addChild(cameraAnchor, camera);

  // add targets
  const pitch = addCameraRigPitchTarget(ctx.world, node, cameraAnchor, type);
  const yaw = addCameraRigYawTarget(ctx.world, node, node, type);
  const zoom = addCameraRigZoomTarget(ctx.world, node, camera, type);

  return [camera, pitch, yaw, zoom];
}

export function addCameraRigPitchTarget(world: World, node: RemoteNode, target: RemoteNode, type: CameraRigType) {
  addComponent(world, PitchComponent, node.eid);
  const pitch: PitchComponent = {
    type,
    target: target.eid,
    pitch: 0,
    maxAngle: 89,
    minAngle: -89,
    sensitivity: DEFAULT_SENSITIVITY,
  };
  PitchComponent.set(node.eid, pitch);
  return pitch;
}

export function addCameraRigYawTarget(world: World, node: RemoteNode, target: RemoteNode, type: CameraRigType) {
  addComponent(world, YawComponent, node.eid);
  const yaw: YawComponent = {
    type,
    target: target.eid,
    sensitivity: DEFAULT_SENSITIVITY,
  };
  YawComponent.set(node.eid, yaw);
  return yaw;
}

export function addCameraRigZoomTarget(world: World, node: RemoteNode, target: RemoteNode, type: CameraRigType) {
  addComponent(world, ZoomComponent, node.eid);
  const zoom: ZoomComponent = {
    type,
    target: target.eid,
    min: ZOOM_MIN,
    max: ZOOM_MAX,
  };
  ZoomComponent.set(node.eid, zoom);
  return zoom;
}

export function addOrbitAnchor(world: World, node: RemoteNode, target: RemoteNode) {
  addComponent(world, OrbitAnchor, node.eid);
  const anchor: OrbitAnchor = {
    target: target.eid,
  };
  OrbitAnchor.set(node.eid, anchor);
  node.position.set(target.position);
  return anchor;
}

function applyYaw(ctx: GameState, controller: InputController, rigYaw: YawComponent) {
  const node = tryGetRemoteResource<RemoteNode>(ctx, rigYaw.target);

  const [lookX] = controller.actionStates.get(CameraRigAction.LookMovement) as vec2;

  if (Math.abs(lookX) >= 1) {
    const sensitivity = rigYaw.sensitivity || 1;
    const quaternion = node.quaternion;
    quat.rotateY(quaternion, quaternion, -(lookX / (1000 / (sensitivity || 1))) * ctx.dt);
  }
}

function applyPitch(ctx: GameState, controller: InputController, rigPitch: PitchComponent) {
  const node = tryGetRemoteResource<RemoteNode>(ctx, rigPitch.target);

  const [, lookY] = controller.actionStates.get(CameraRigAction.LookMovement) as vec2;

  if (Math.abs(lookY) >= 1) {
    const sensitivity = rigPitch.sensitivity;
    const maxAngle = rigPitch.maxAngle;
    const minAngle = rigPitch.minAngle;
    const maxAngleRads = glm.toRadian(maxAngle);
    const minAngleRads = glm.toRadian(minAngle);

    let pitch = rigPitch.pitch;

    pitch -= (lookY / (1000 / (sensitivity || 1))) * ctx.dt;

    if (pitch > maxAngleRads) {
      pitch = maxAngleRads;
    } else if (pitch < minAngleRads) {
      pitch = minAngleRads;
    }

    rigPitch.pitch = pitch;

    quat.setAxisAngle(node.quaternion, Axes.X, pitch);
  }
}

const _v = vec3.create();
function applyZoom(ctx: GameState, controller: InputController, rigZoom: ZoomComponent) {
  const node = tryGetRemoteResource<RemoteNode>(ctx, rigZoom.target);

  const [, scrollY] = controller.actionStates.get(CameraRigAction.Zoom) as vec2;

  if (Math.abs(scrollY) > 0) {
    node.position[2] -= scrollY / 1000;
    node.position[2] = clamp(node.position[2], rigZoom.min, rigZoom.max);
  }
}

export function CameraRigSystem(ctx: GameState) {
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);
  const camRigModule = getModule(ctx, CameraRigModule);

  if (network.authoritative && !isHost(network) && !network.clientSidePrediction) {
    return;
  }

  // sync orbit anchor with their target's position
  const orbitAnchors = orbitAnchorQuery(ctx.world);
  for (let i = 0; i < orbitAnchors.length; i++) {
    const eid = orbitAnchors[i];
    const orbitAnchor = OrbitAnchor.get(eid)!;
    const orbitAnchorNode = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const targetNode = getRemoteResource<RemoteNode>(ctx, orbitAnchor.target);

    // if not orbiting anymore or target was removed, remove the orbit anchor
    if (!camRigModule.orbiting || !targetNode) {
      // if target removed, return control to the avatar
      if (!targetNode) stopOrbit(ctx);
      removeObjectFromWorld(ctx, orbitAnchorNode);
      continue;
    }

    // otherwise set its position to the target
    mat4.getTranslation(_v, targetNode.worldMatrix);
    vec3.copy(orbitAnchorNode.position, _v);
  }

  // stop orbiting if esc is pressed
  const controllers = inputControllerQuery(ctx.world);
  for (let i = 0; i < controllers.length; i++) {
    const eid = controllers[i];
    const controller = tryGetInputController(input, eid);
    const exitOrbit = controller.actionStates.get(CameraRigAction.ExitOrbit) as ButtonActionState;
    if (exitOrbit.pressed) {
      stopOrbit(ctx);
    }
  }

  const pitchEntities = pitchQuery(ctx.world);
  for (let i = 0; i < pitchEntities.length; i++) {
    const eid = pitchEntities[i];
    const pitch = PitchComponent.get(eid)!;
    const controller = tryGetInputController(input, eid);

    const leftMouse = controller.actionStates.get(CameraRigAction.LeftMouse) as ButtonActionState;
    if (pitch.type === CameraRigType.Orbit && !leftMouse.held) {
      continue;
    }

    applyPitch(ctx, controller, pitch);
  }

  const yawEntities = yawQuery(ctx.world);
  for (let i = 0; i < yawEntities.length; i++) {
    const eid = yawEntities[i];
    const yaw = YawComponent.get(eid)!;
    const controller = tryGetInputController(input, eid);

    const leftMouse = controller.actionStates.get(CameraRigAction.LeftMouse) as ButtonActionState;
    if (yaw.type === CameraRigType.Orbit && !leftMouse.held) {
      continue;
    }

    applyYaw(ctx, controller, yaw);
  }

  const zoomEntities = zoomQuery(ctx.world);
  for (let i = 0; i < zoomEntities.length; i++) {
    const eid = zoomEntities[i];
    const zoom = ZoomComponent.get(eid)!;
    const controller = tryGetInputController(input, eid);

    if (zoom.type === CameraRigType.PointerLock && !hasComponent(ctx.world, ThirdPersonComponent, eid)) {
      continue;
    }

    applyZoom(ctx, controller, zoom);
  }

  exitQueryCleanup(ctx, exitPitchQuery, PitchComponent);
  exitQueryCleanup(ctx, exitYawQuery, YawComponent);
  exitQueryCleanup(ctx, exitZoomQuery, ZoomComponent);
  exitQueryCleanup(ctx, exitOrbitAnchorQuery, OrbitAnchor);
}

function exitQueryCleanup(ctx: GameState, query: Query, component: Map<number, any>) {
  const ents = query(ctx.world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    component.delete(eid);
  }
}

/**************
 * Networking *
 *************/

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

export function NetworkedCameraSystem(ctx: GameState) {
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
