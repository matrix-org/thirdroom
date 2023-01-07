import RAPIER from "@dimforge/rapier3d-compat";
import { defineComponent, Types, removeComponent, addComponent, hasComponent, defineQuery } from "bitecs";
import { vec3, mat4, quat, vec2 } from "gl-matrix";
import { Quaternion, Vector3, Vector4 } from "three";

import { playAudio } from "../../engine/audio/audio.game";
import { getCamera } from "../../engine/camera/camera.game";
import { OurPlayer } from "../../engine/component/Player";
import { removeNode } from "../../engine/component/transform";
import { MAX_OBJECT_CAP, NOOP } from "../../engine/config.common";
import { GameState } from "../../engine/GameTypes";
import {
  enableActionMap,
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
} from "../../engine/input/ActionMappingSystem";
import { InputModule } from "../../engine/input/input.game";
import { getInputController, InputController, inputControllerQuery } from "../../engine/input/InputController";
import { defineModule, getModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { isHost } from "../../engine/network/network.common";
import {
  GameNetworkState,
  getPeerIndexFromNetworkId,
  Networked,
  networkedQuery,
  NetworkModule,
  Owned,
  ownedNetworkedQuery,
} from "../../engine/network/network.game";
import { takeOwnership } from "../../engine/network/ownership.game";
import {
  addCollisionGroupMembership,
  FocusCollisionGroup,
  focusShapeCastCollisionGroups,
  GrabCollisionGroup,
  grabShapeCastCollisionGroups,
  removeCollisionGroupMembership,
} from "../../engine/physics/CollisionGroups";
import { PhysicsModule, PhysicsModuleState, RigidBody } from "../../engine/physics/physics.game";
import { Prefab } from "../../engine/prefab/prefab.game";
import {
  addResourceRef,
  getRemoteResource,
  RemoteAudioData,
  RemoteAudioEmitter,
  RemoteAudioSource,
  RemoteNode,
  tryGetRemoteResource,
} from "../../engine/resource/resource.game";
import { AudioEmitterType, InteractableType } from "../../engine/resource/schema";
import { createDisposables } from "../../engine/utils/createDisposables";
import { clamp } from "../../engine/utils/interpolation";
import { PortalComponent } from "../portals/portals.game";
import {
  ObjectCapReachedMessageType,
  SetObjectCapMessage,
  SetObjectCapMessageType,
} from "../spawnables/spawnables.common";
import { InteractableAction, InteractionMessage, InteractionMessageType } from "./interaction.common";

// TODO: importing from spawnables.game in this file induces a runtime error
// import { SpawnablesModule } from "../spawnables/spawnables.game";

type InteractionModuleState = {
  clickEmitter?: RemoteAudioEmitter;
  // HACK: add duplicate obj cap config to interaction module until import issue is resolved
  maxObjCap: number;
};

export const InteractionModule = defineModule<GameState, InteractionModuleState>({
  name: "interaction",
  create() {
    return {
      maxObjCap: MAX_OBJECT_CAP,
    };
  },
  async init(ctx) {
    const module = getModule(ctx, InteractionModule);

    const clickAudio1 = new RemoteAudioData(ctx.resourceManager, {
      name: "Click1 Audio Data",
      uri: "/audio/click1.wav",
    });
    addResourceRef(ctx, clickAudio1.eid);

    const clickAudio2 = new RemoteAudioData(ctx.resourceManager, {
      name: "Click2 Audio Data",
      uri: "/audio/click2.wav",
    });
    addResourceRef(ctx, clickAudio2.eid);

    const clickAudioSource1 = new RemoteAudioSource(ctx.resourceManager, {
      audio: clickAudio1,
      loop: false,
      autoPlay: false,
      gain: 0.2,
    });
    addResourceRef(ctx, clickAudioSource1.eid);

    const clickAudioSource2 = new RemoteAudioSource(ctx.resourceManager, {
      audio: clickAudio2,
      loop: false,
      autoPlay: false,
      gain: 0.2,
    });
    addResourceRef(ctx, clickAudioSource2.eid);

    module.clickEmitter = new RemoteAudioEmitter(ctx.resourceManager, {
      type: AudioEmitterType.Global,
      sources: [clickAudioSource1, clickAudioSource2],
    });

    addResourceRef(ctx, module.clickEmitter.eid);

    const input = getModule(ctx, InputModule);
    const controller = input.defaultController;
    enableActionMap(controller, InteractionActionMap);

    ctx.worldResource.persistentScene.audioEmitters = [
      ...ctx.worldResource.persistentScene.audioEmitters,
      module.clickEmitter,
    ];

    return createDisposables([registerMessageHandler(ctx, SetObjectCapMessageType, onSetObjectCap)]);
  },
});

function onSetObjectCap(ctx: GameState, message: SetObjectCapMessage) {
  const module = getModule(ctx, InteractionModule);
  module.maxObjCap = message.value;
}

const InteractionActionMap: ActionMap = {
  id: "interaction",
  actionDefs: [
    {
      id: "grab",
      path: "Grab",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Mouse/Left",
        },
      ],
      networked: true,
    },
    {
      id: "grab2",
      path: "Grab2",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyE",
        },
      ],
      networked: true,
    },
    {
      id: "throw",
      path: "Throw",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Mouse/Right",
        },
      ],
      networked: true,
    },
    {
      id: "throw2",
      path: "Throw2",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Mouse/Left",
        },
      ],
      networked: true,
    },
    {
      id: "delete",
      path: "Delete",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyX",
        },
      ],
      networked: true,
    },
    {
      id: "scroll",
      path: "Scroll",
      type: ActionType.Vector2,
      bindings: [
        {
          type: BindingType.Axes,
          y: "Mouse/Scroll",
        },
      ],
      networked: true,
    },
  ],
};

export const Interactable = defineComponent({
  type: Types.ui8,
  interactionDistance: Types.f32,
});

const FocusComponent = defineComponent({
  focusedEntity: Types.eid,
});

export const GrabComponent = defineComponent({
  grabbedEntity: Types.eid,
  heldOffset: Types.f32,
  joint: [Types.f32, 3],
});

const MAX_FOCUS_DISTANCE = 3.3;
const MIN_HELD_DISTANCE = 1.5;
const MAX_HELD_DISTANCE = 8;
const GRAB_DISTANCE = 3.3;
const HELD_MOVE_SPEED = 10;
const THROW_FORCE = 10;

const _direction = vec3.create();
const _source = vec3.create();
const _target = vec3.create();

const _impulse = new Vector3();

const _cameraWorldQuat = quat.create();

const shapeCastPosition = new Vector3();
const shapeCastRotation = new Quaternion();

const colliderShape = new RAPIER.Ball(0.01);

const _s = new Vector3();
const _t = new Vector3();

const _r = new Vector4();

const zero = new Vector3();

const remoteNodeQuery = defineQuery([RemoteNode]);
const interactableQuery = defineQuery([Interactable]);

export function InteractionSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);
  const interaction = getModule(ctx, InteractionModule);

  const remoteNodeEntities = remoteNodeQuery(ctx.world);

  for (let i = 0; i < remoteNodeEntities.length; i++) {
    const eid = remoteNodeEntities[i];
    const remoteNode = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const interactable = remoteNode.interactable;
    const hasInteractable = hasComponent(ctx.world, Interactable, eid);

    if (interactable && !hasInteractable && interactable.type === InteractableType.Interactable) {
      addInteractableComponent(ctx, physics, remoteNode, interactable.type);
    } else if (!interactable && hasInteractable && Interactable.type[eid] === InteractableType.Interactable) {
      removeInteractableComponent(ctx, physics, remoteNode);
    }
  }

  const interactableEntities = interactableQuery(ctx.world);

  for (let i = 0; i < interactableEntities.length; i++) {
    const eid = interactableEntities[i];

    if (Interactable.type[eid] !== InteractableType.Interactable) {
      continue;
    }

    const remoteNode = getRemoteResource<RemoteNode>(ctx, eid);
    const interactable = remoteNode?.interactable;

    if (interactable) {
      interactable.pressed = false;
      interactable.released = false;
    }
  }

  const rigs = inputControllerQuery(ctx.world);

  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const rig = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const camera = getCamera(ctx, rig);
    const controller = getInputController(input, eid);

    updateFocus(ctx, physics, rig, camera);

    const hosting = network.authoritative && isHost(network);
    const cspEnabled = network.authoritative && network.clientSidePrediction;
    const p2p = !network.authoritative;

    if (hosting || cspEnabled || p2p) {
      updateDeletion(ctx, interaction, controller, eid);
      updateGrabThrow(ctx, interaction, physics, network, controller, rig, camera);
    }
  }
}

function updateFocus(ctx: GameState, physics: PhysicsModuleState, rig: RemoteNode, camera: RemoteNode) {
  // raycast outward from camera
  const cameraMatrix = camera.worldMatrix;
  mat4.getRotation(_cameraWorldQuat, cameraMatrix);

  const target = vec3.set(_target, 0, 0, -1);
  vec3.transformQuat(target, target, _cameraWorldQuat);
  vec3.scale(target, target, MAX_FOCUS_DISTANCE);

  const source = mat4.getTranslation(_source, cameraMatrix);

  const s: Vector3 = _s.fromArray(source);
  const t: Vector3 = _t.fromArray(target);

  shapeCastPosition.copy(s);

  const hit = physics.physicsWorld.castShape(
    shapeCastPosition,
    shapeCastRotation,
    t,
    colliderShape,
    10.0,
    true,
    focusShapeCastCollisionGroups
  );

  let eid;

  if (hit !== null) {
    eid = physics.handleToEid.get(hit.collider.handle);
    if (!eid) {
      console.warn(`Could not find entity for physics handle ${hit.collider.handle}`);
    } else if (hit.toi <= Interactable.interactionDistance[eid]) {
      addComponent(ctx.world, FocusComponent, rig.eid);
      FocusComponent.focusedEntity[rig.eid] = eid;
    }
  } else {
    // clear focus
    removeComponent(ctx.world, FocusComponent, rig.eid, true);
  }

  // only update UI if it's our player
  const ourPlayer = hasComponent(ctx.world, OurPlayer, rig.eid);
  if (ourPlayer) {
    // TODO: only send these messages when they change
    if (FocusComponent.focusedEntity[rig.eid]) sendInteractionMessage(ctx, InteractableAction.Focus, eid);
    if (!FocusComponent.focusedEntity[rig.eid]) sendInteractionMessage(ctx, InteractableAction.Unfocus);
  }
}

function updateDeletion(ctx: GameState, interaction: InteractionModuleState, controller: InputController, rig: number) {
  const deleteBtn = controller.actionStates.get("Delete") as ButtonActionState;
  if (deleteBtn.pressed) {
    const focusedEid = FocusComponent.focusedEntity[rig];
    const focused = getRemoteResource<RemoteNode>(ctx, focusedEid);
    // TODO: For now we only delete owned objects
    if (
      focused &&
      hasComponent(ctx.world, Owned, focused.eid) &&
      Interactable.type[focused.eid] === InteractableType.Grabbable
    ) {
      removeNode(focused);
      playAudio(interaction.clickEmitter?.sources[1] as RemoteAudioSource, { gain: 0.4 });
    }
  }
}

function updateGrabThrow(
  ctx: GameState,
  interaction: InteractionModuleState,
  physics: PhysicsModuleState,
  network: GameNetworkState,
  controller: InputController,
  rig: RemoteNode,
  camera: RemoteNode
) {
  let heldEntity = GrabComponent.grabbedEntity[rig.eid];
  let heldOffset = GrabComponent.heldOffset[rig.eid];

  const grabBtn = controller.actionStates.get("Grab") as ButtonActionState;
  const grabBtn2 = controller.actionStates.get("Grab2") as ButtonActionState;
  const throwBtn = controller.actionStates.get("Throw") as ButtonActionState;
  const throwBtn2 = controller.actionStates.get("Throw2") as ButtonActionState;

  const grabPressed = grabBtn.pressed || grabBtn2.pressed;
  const grabReleased = grabBtn.released || grabBtn2.released;
  const throwPressed = throwBtn.pressed || throwBtn2.pressed;

  const ourPlayer = hasComponent(ctx.world, OurPlayer, rig.eid);

  // if holding and entity and throw is pressed
  if (heldEntity && throwPressed) {
    removeComponent(ctx.world, GrabComponent, rig.eid, true);

    mat4.getRotation(_cameraWorldQuat, camera.worldMatrix);
    const direction = vec3.set(_direction, 0, 0, -1);
    vec3.transformQuat(direction, direction, _cameraWorldQuat);
    vec3.scale(direction, direction, THROW_FORCE);

    // fire!
    _impulse.fromArray(direction);
    RigidBody.store.get(heldEntity)?.applyImpulse(_impulse, true);

    if (ourPlayer) {
      sendInteractionMessage(ctx, InteractableAction.Release, heldEntity);
      sendInteractionMessage(ctx, InteractableAction.Unfocus);
    }

    playAudio(interaction.clickEmitter?.sources[0] as RemoteAudioSource, { playbackRate: 0.6 });

    GrabComponent.heldOffset[rig.eid] = 0;

    // if holding an entity and grab is pressed again
  } else if (grabPressed && heldEntity) {
    // release
    removeComponent(ctx.world, GrabComponent, rig.eid, true);

    if (ourPlayer) {
      sendInteractionMessage(ctx, InteractableAction.Release, heldEntity);
      sendInteractionMessage(ctx, InteractableAction.Unfocus);
    }

    playAudio(interaction.clickEmitter?.sources[0] as RemoteAudioSource, { playbackRate: 0.6 });

    GrabComponent.heldOffset[rig.eid] = 0;

    // if grab is pressed
  } else if (grabPressed) {
    // raycast outward from camera
    const cameraMatrix = camera.worldMatrix;
    mat4.getRotation(_cameraWorldQuat, cameraMatrix);

    const target = vec3.set(_target, 0, 0, -1);
    vec3.transformQuat(target, target, _cameraWorldQuat);
    vec3.scale(target, target, GRAB_DISTANCE);

    const source = mat4.getTranslation(_source, cameraMatrix);

    const s: Vector3 = _s.fromArray(source);
    const t: Vector3 = _t.fromArray(target);

    shapeCastPosition.copy(s);

    const shapecastHit = physics.physicsWorld.castShape(
      shapeCastPosition,
      shapeCastRotation,
      t,
      colliderShape,
      10.0,
      true,
      grabShapeCastCollisionGroups
    );

    if (shapecastHit !== null) {
      const eid = physics.handleToEid.get(shapecastHit.collider.handle);
      const node = eid ? getRemoteResource<RemoteNode>(ctx, eid) : undefined;

      if (!node || !eid) {
        console.warn(`Could not find entity for physics handle ${shapecastHit.collider.handle}`);
      } else if (shapecastHit.toi <= Interactable.interactionDistance[node.eid]) {
        if (Interactable.type[node.eid] === InteractableType.Grabbable) {
          playAudio(interaction.clickEmitter?.sources[0] as RemoteAudioSource, { playbackRate: 1 });

          const ownedEnts = network.authoritative ? networkedQuery(ctx.world) : ownedNetworkedQuery(ctx.world);
          if (ownedEnts.length > interaction.maxObjCap && !hasComponent(ctx.world, Owned, node.eid)) {
            // do nothing if we hit the max obj cap
            ctx.sendMessage(Thread.Main, {
              type: ObjectCapReachedMessageType,
            });
          } else {
            // otherwise attempt to take ownership
            const newEid = takeOwnership(ctx, network, node);

            if (newEid !== NOOP) {
              addComponent(ctx.world, GrabComponent, rig.eid);
              GrabComponent.grabbedEntity[rig.eid] = newEid;
              heldEntity = newEid;
              if (ourPlayer) sendInteractionMessage(ctx, InteractableAction.Grab, newEid);
            } else {
              addComponent(ctx.world, GrabComponent, rig.eid);
              GrabComponent.grabbedEntity[rig.eid] = eid;
              if (ourPlayer) sendInteractionMessage(ctx, InteractableAction.Grab, eid);
            }
          }
        } else if (Interactable.type[node.eid] === InteractableType.Interactable) {
          playAudio(interaction.clickEmitter?.sources[0] as RemoteAudioSource, { playbackRate: 1 });
          if (ourPlayer) sendInteractionMessage(ctx, InteractableAction.Interact, eid);
          const remoteNode = getRemoteResource<RemoteNode>(ctx, node.eid);
          const interactable = remoteNode?.interactable;

          if (interactable) {
            interactable.pressed = true;
            interactable.released = false;
            interactable.held = true;
          }
        } else {
          if (ourPlayer) sendInteractionMessage(ctx, InteractableAction.Grab, eid);
        }
      }
    }
  }

  if (grabReleased) {
    const interactableEntities = interactableQuery(ctx.world);

    for (let i = 0; i < interactableEntities.length; i++) {
      const eid = interactableEntities[i];

      if (Interactable.type[eid] !== InteractableType.Interactable) {
        continue;
      }

      const remoteNode = getRemoteResource<RemoteNode>(ctx, eid);
      const interactable = remoteNode?.interactable;

      if (interactable) {
        interactable.pressed = false;
        interactable.released = true;
        interactable.held = false;
      }
    }
  }

  // if still holding entity, move towards the held point
  heldEntity = GrabComponent.grabbedEntity[rig.eid];

  const heldNode = getRemoteResource<RemoteNode>(ctx, heldEntity);

  if (heldNode) {
    // move held point upon scrolling
    const [, scrollY] = controller.actionStates.get("Scroll") as vec2;
    if (scrollY !== 0) {
      heldOffset -= scrollY / 1000;
    }
    GrabComponent.heldOffset[rig.eid] = clamp(MIN_HELD_DISTANCE, MAX_HELD_DISTANCE, heldOffset);

    const heldPosition = heldNode.position;

    const target = _target;
    mat4.getTranslation(target, camera.worldMatrix);

    mat4.getRotation(_cameraWorldQuat, camera.worldMatrix);
    const direction = vec3.set(_direction, 0, 0, 1);
    vec3.transformQuat(direction, direction, _cameraWorldQuat);
    vec3.scale(direction, direction, MIN_HELD_DISTANCE + heldOffset);

    vec3.sub(target, target, direction);

    vec3.sub(target, target, heldPosition);

    vec3.scale(target, target, HELD_MOVE_SPEED - heldOffset / 2);

    const body = RigidBody.store.get(heldEntity);
    if (body) {
      body.setLinvel(_impulse.fromArray(target), true);
      body.setAngvel(zero, true);
      body.setRotation(_r.fromArray(_cameraWorldQuat), true);
    }
  }
}

function sendInteractionMessage(ctx: GameState, action: InteractableAction, eid = NOOP) {
  const network = getModule(ctx, NetworkModule);

  const interactableType = Interactable.type[eid];

  if (!eid || !interactableType) {
    ctx.sendMessage<InteractionMessage>(Thread.Main, {
      type: InteractionMessageType,
      action,
    });
  } else {
    let peerId;

    if (interactableType === InteractableType.Grabbable || interactableType === InteractableType.Player) {
      peerId = network.entityIdToPeerId.get(eid);
    }

    let ownerId;

    if (interactableType === InteractableType.Grabbable) {
      const ownerIdIndex = getPeerIndexFromNetworkId(Networked.networkId[eid]);
      ownerId = network.indexToPeerId.get(ownerIdIndex);
      if (hasComponent(ctx.world, Owned, eid)) {
        ownerId = peerId;
      }
    }

    let uri;

    if (interactableType === InteractableType.Portal) {
      uri = PortalComponent.get(eid)?.uri;
    }

    ctx.sendMessage<InteractionMessage>(Thread.Main, {
      type: InteractionMessageType,
      interactableType,
      name: Prefab.get(eid) || getRemoteResource<RemoteNode>(ctx, eid)?.name,
      held: hasComponent(ctx.world, GrabComponent, eid),
      action,
      peerId,
      ownerId,
      uri,
    });
  }
}

export function addInteractableComponent(
  ctx: GameState,
  physics: PhysicsModuleState,
  node: RemoteNode,
  interactableType: InteractableType
) {
  const eid = node.eid;
  addComponent(ctx.world, Interactable, eid);
  Interactable.type[eid] = interactableType;
  Interactable.interactionDistance[eid] = interactableType === InteractableType.Interactable ? 10 : 1;

  const rigidBody = RigidBody.store.get(eid);
  if (!rigidBody) {
    console.warn(
      `Adding interactable component to entity "${eid}" without a RigidBody component. This entity will not be interactable.`
    );
    return;
  }

  for (let i = 0; i < rigidBody.numColliders(); i++) {
    const collider = rigidBody.collider(i);

    let collisionGroups = collider.collisionGroups();

    collisionGroups = addCollisionGroupMembership(collisionGroups, FocusCollisionGroup);
    collisionGroups = addCollisionGroupMembership(collisionGroups, GrabCollisionGroup);

    collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    collider.setCollisionGroups(collisionGroups);
  }
}

export function removeInteractableComponent(ctx: GameState, physics: PhysicsModuleState, node: RemoteNode) {
  removeComponent(ctx.world, Interactable, node.eid);

  const rigidBody = RigidBody.store.get(node.eid);
  if (!rigidBody) {
    console.warn(
      `Adding interactable component to entity "${node.name}" without a RigidBody component. This entity will not be interactable.`
    );
    return;
  }

  for (let i = 0; i < rigidBody.numColliders(); i++) {
    const collider = rigidBody.collider(i);

    let collisionGroups = collider.collisionGroups();

    collisionGroups = removeCollisionGroupMembership(collisionGroups, FocusCollisionGroup);
    collisionGroups = removeCollisionGroupMembership(collisionGroups, GrabCollisionGroup);

    collider.setCollisionGroups(collisionGroups);
  }
}
