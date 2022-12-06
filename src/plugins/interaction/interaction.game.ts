import RAPIER from "@dimforge/rapier3d-compat";
import { defineComponent, Types, removeComponent, addComponent, hasComponent, defineQuery } from "bitecs";
import { vec3, mat4, quat, vec2 } from "gl-matrix";
import { Quaternion, Vector3, Vector4 } from "three";

import {
  createRemoteAudioData,
  createRemoteAudioSource,
  createRemoteGlobalAudioEmitter,
  playAudio,
  RemoteAudioSource,
  RemoteGlobalAudioEmitter,
} from "../../engine/audio/audio.game";
import { getCamera } from "../../engine/camera/camera.game";
import { OurPlayer } from "../../engine/component/Player";
import { removeRecursive, Transform } from "../../engine/component/transform";
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
  NetworkModule,
  Owned,
  ownedNetworkedQuery,
} from "../../engine/network/network.game";
import { takeOwnership } from "../../engine/network/ownership.game";
import { RemoteNodeComponent } from "../../engine/node/node.game";
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
import { addResourceRef } from "../../engine/resource/resource.game";
import { InteractableType } from "../../engine/resource/schema";
import { RemoteSceneComponent } from "../../engine/scene/scene.game";
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
  clickEmitter?: RemoteGlobalAudioEmitter;
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

    const clickAudio1 = createRemoteAudioData(ctx, { name: "Click1 Audio Data", uri: "/audio/click1.wav" });
    addResourceRef(ctx, clickAudio1.resourceId);

    const clickAudio2 = createRemoteAudioData(ctx, { name: "Click2 Audio Data", uri: "/audio/click2.wav" });
    addResourceRef(ctx, clickAudio2.resourceId);

    const clickAudioSource1 = createRemoteAudioSource(ctx, {
      audio: clickAudio1,
      loop: false,
      autoPlay: false,
      gain: 0.2,
    });
    addResourceRef(ctx, clickAudioSource1.resourceId);

    const clickAudioSource2 = createRemoteAudioSource(ctx, {
      audio: clickAudio2,
      loop: false,
      autoPlay: false,
      gain: 0.2,
    });
    addResourceRef(ctx, clickAudioSource2.resourceId);

    module.clickEmitter = createRemoteGlobalAudioEmitter(ctx, {
      sources: [clickAudioSource1, clickAudioSource2],
    });

    addResourceRef(ctx, module.clickEmitter.resourceId);

    const input = getModule(ctx, InputModule);
    const controller = input.defaultController;
    enableActionMap(controller, InteractionActionMap);

    return createDisposables([registerMessageHandler(ctx, SetObjectCapMessageType, onSetObjectCap)]);
  },
});

function onSetObjectCap(ctx: GameState, message: SetObjectCapMessage) {
  const module = getModule(ctx, InteractionModule);
  module.maxObjCap = message.value;
}

const InteractionActionMap: ActionMap = {
  id: "interaction",
  actions: [
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

let lastActiveScene = 0;

let heldOffset = 0;

const remoteNodeQuery = defineQuery([RemoteNodeComponent]);
const interactableQuery = defineQuery([Interactable]);

export function InteractionSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);
  const interaction = getModule(ctx, InteractionModule);

  // HACK: add click emitter to current scene (scene is replaced when loading a world, global audio emitters are wiped along with it)
  if (lastActiveScene !== ctx.activeScene) {
    const remoteScene = RemoteSceneComponent.get(ctx.activeScene);
    if (remoteScene && interaction.clickEmitter && !remoteScene.audioEmitters.includes(interaction.clickEmitter)) {
      remoteScene.audioEmitters = [...remoteScene.audioEmitters, interaction.clickEmitter];
    }
    lastActiveScene = ctx.activeScene;
  }

  const remoteNodeEntities = remoteNodeQuery(ctx.world);

  for (let i = 0; i < remoteNodeEntities.length; i++) {
    const eid = remoteNodeEntities[i];
    const remoteNode = RemoteNodeComponent.get(eid);
    const interactable = remoteNode?.scriptNode?.interactable;
    const hasInteractable = hasComponent(ctx.world, Interactable, eid);

    if (interactable && !hasInteractable && interactable.type === InteractableType.Interactable) {
      addInteractableComponent(ctx, physics, eid, interactable.type);
    } else if (!interactable && hasInteractable && Interactable.type[eid] === InteractableType.Interactable) {
      removeInteractableComponent(ctx, physics, eid);
    }
  }

  const interactableEntities = interactableQuery(ctx.world);

  for (let i = 0; i < interactableEntities.length; i++) {
    const eid = interactableEntities[i];

    if (Interactable.type[eid] !== InteractableType.Interactable) {
      continue;
    }

    const remoteNode = RemoteNodeComponent.get(eid);
    const interactable = remoteNode?.scriptNode?.interactable;

    if (interactable) {
      interactable.pressed = false;
      interactable.released = false;
    }
  }

  const rigs = inputControllerQuery(ctx.world);

  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const camera = getCamera(ctx, eid);
    const controller = getInputController(input, eid);

    updateFocus(ctx, physics, eid, camera);

    const authoritativeAndHosting = network.authoritative && isHost(network);

    if (authoritativeAndHosting || !network.authoritative) {
      updateDeletion(ctx, interaction, controller, eid);
      updateGrabThrow(ctx, interaction, physics, network, controller, eid, camera);
    }
  }
}

function updateFocus(ctx: GameState, physics: PhysicsModuleState, rig: number, camera: number) {
  // raycast outward from camera
  const cameraMatrix = Transform.worldMatrix[camera];
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
    focusShapeCastCollisionGroups
  );

  let eid;

  if (hit !== null) {
    eid = physics.handleToEid.get(hit.colliderHandle);
    if (!eid) {
      console.warn(`Could not find entity for physics handle ${hit.colliderHandle}`);
    } else if (hit.toi <= Interactable.interactionDistance[eid]) {
      addComponent(ctx.world, FocusComponent, rig);
      FocusComponent.focusedEntity[rig] = eid;
    }
  } else {
    // clear focus
    removeComponent(ctx.world, FocusComponent, rig, true);
  }

  // only update UI if it's our player
  const ourPlayer = hasComponent(ctx.world, OurPlayer, rig);
  if (ourPlayer) {
    // TODO: only send these messages when they change
    if (FocusComponent.focusedEntity[rig]) sendInteractionMessage(ctx, InteractableAction.Focus, eid);
    if (!FocusComponent.focusedEntity[rig]) sendInteractionMessage(ctx, InteractableAction.Unfocus);
  }
}

function updateDeletion(ctx: GameState, interaction: InteractionModuleState, controller: InputController, rig: number) {
  const deleteBtn = controller.actions.get("Delete") as ButtonActionState;
  if (deleteBtn.pressed) {
    const focused = FocusComponent.focusedEntity[rig];
    // TODO: For now we only delete owned objects
    if (
      focused &&
      hasComponent(ctx.world, Owned, focused) &&
      Interactable.type[focused] === InteractableType.Grabbable
    ) {
      removeRecursive(ctx.world, focused);
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
  rig: number,
  camera: number
) {
  let heldEntity = GrabComponent.grabbedEntity[rig];

  const grabBtn = controller.actions.get("Grab") as ButtonActionState;
  const grabBtn2 = controller.actions.get("Grab2") as ButtonActionState;
  const throwBtn = controller.actions.get("Throw") as ButtonActionState;
  const throwBtn2 = controller.actions.get("Throw2") as ButtonActionState;

  const grabPressed = grabBtn.pressed || grabBtn2.pressed;
  const grabReleased = grabBtn.released || grabBtn2.released;
  const throwPressed = throwBtn.pressed || throwBtn2.pressed;

  const ourPlayer = hasComponent(ctx.world, OurPlayer, rig);

  // if holding and entity and throw is pressed
  if (heldEntity && throwPressed) {
    removeComponent(ctx.world, GrabComponent, rig, true);

    mat4.getRotation(_cameraWorldQuat, Transform.worldMatrix[camera]);
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

    heldOffset = 0;

    // if holding an entity and grab is pressed again
  } else if (grabPressed && heldEntity) {
    // release
    removeComponent(ctx.world, GrabComponent, rig, true);

    if (ourPlayer) {
      sendInteractionMessage(ctx, InteractableAction.Release, heldEntity);
      sendInteractionMessage(ctx, InteractableAction.Unfocus);
    }

    playAudio(interaction.clickEmitter?.sources[0] as RemoteAudioSource, { playbackRate: 0.6 });

    heldOffset = 0;

    // if grab is pressed
  } else if (grabPressed) {
    // raycast outward from camera
    const cameraMatrix = Transform.worldMatrix[camera];
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
      grabShapeCastCollisionGroups
    );

    if (shapecastHit !== null) {
      const eid = physics.handleToEid.get(shapecastHit.colliderHandle);

      if (!eid) {
        console.warn(`Could not find entity for physics handle ${shapecastHit.colliderHandle}`);
      } else if (shapecastHit.toi <= Interactable.interactionDistance[eid]) {
        if (Interactable.type[eid] === InteractableType.Grabbable) {
          playAudio(interaction.clickEmitter?.sources[0] as RemoteAudioSource, { playbackRate: 1 });

          const ownedEnts = ownedNetworkedQuery(ctx.world);
          if (ownedEnts.length > interaction.maxObjCap && !hasComponent(ctx.world, Owned, eid)) {
            // do nothing if we hit the max obj cap
            ctx.sendMessage(Thread.Main, {
              type: ObjectCapReachedMessageType,
            });
          } else {
            // otherwise attempt to take ownership
            const newEid = takeOwnership(ctx, network, eid);

            if (newEid !== NOOP) {
              addComponent(ctx.world, GrabComponent, rig);
              GrabComponent.grabbedEntity[rig] = newEid;
              heldEntity = newEid;
              if (ourPlayer) sendInteractionMessage(ctx, InteractableAction.Grab, newEid);
            } else {
              addComponent(ctx.world, GrabComponent, rig);
              GrabComponent.grabbedEntity[rig] = eid;
              if (ourPlayer) sendInteractionMessage(ctx, InteractableAction.Grab, eid);
            }
          }
        } else if (Interactable.type[eid] === InteractableType.Interactable) {
          playAudio(interaction.clickEmitter?.sources[0] as RemoteAudioSource, { playbackRate: 1 });
          if (ourPlayer) sendInteractionMessage(ctx, InteractableAction.Interact, eid);
          const remoteNode = RemoteNodeComponent.get(eid);
          const interactable = remoteNode?.scriptNode?.interactable;

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

      const remoteNode = RemoteNodeComponent.get(eid);
      const interactable = remoteNode?.scriptNode?.interactable;

      if (interactable) {
        interactable.pressed = false;
        interactable.released = true;
        interactable.held = false;
      }
    }
  }

  // if still holding entity, move towards the held point
  heldEntity = GrabComponent.grabbedEntity[rig];

  if (heldEntity) {
    // move held point upon scrolling
    const [, scrollY] = controller.actions.get("Scroll") as vec2;
    if (scrollY !== 0) {
      heldOffset += scrollY / 1000;
    }
    heldOffset = clamp(MIN_HELD_DISTANCE, MAX_HELD_DISTANCE, heldOffset);

    const heldPosition = Transform.position[heldEntity];

    const target = _target;
    mat4.getTranslation(target, Transform.worldMatrix[camera]);

    mat4.getRotation(_cameraWorldQuat, Transform.worldMatrix[camera]);
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
      name: Prefab.get(eid) || RemoteNodeComponent.get(eid)?.name,
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
  eid: number,
  interactableType: InteractableType
) {
  addComponent(ctx.world, Interactable, eid);
  Interactable.type[eid] = interactableType;
  Interactable.interactionDistance[eid] = interactableType === InteractableType.Interactable ? 10 : 1;

  const { physicsWorld } = physics;

  const rigidBody = RigidBody.store.get(eid);
  if (!rigidBody) {
    console.warn(
      `Adding interactable component to entity "${eid}" without a RigidBody component. This entity will not be interactable.`
    );
    return;
  }

  for (let i = 0; i < rigidBody.numColliders(); i++) {
    const colliderHandle = rigidBody.collider(i);
    const collider = physicsWorld.getCollider(colliderHandle);

    let collisionGroups = collider.collisionGroups();

    collisionGroups = addCollisionGroupMembership(collisionGroups, FocusCollisionGroup);
    collisionGroups = addCollisionGroupMembership(collisionGroups, GrabCollisionGroup);

    collider.setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS);
    collider.setCollisionGroups(collisionGroups);
  }
}

export function removeInteractableComponent(ctx: GameState, physics: PhysicsModuleState, eid: number) {
  removeComponent(ctx.world, Interactable, eid);

  const { physicsWorld } = physics;

  const rigidBody = RigidBody.store.get(eid);
  if (!rigidBody) {
    console.warn(
      `Adding interactable component to entity "${eid}" without a RigidBody component. This entity will not be interactable.`
    );
    return;
  }

  for (let i = 0; i < rigidBody.numColliders(); i++) {
    const colliderHandle = rigidBody.collider(i);
    const collider = physicsWorld.getCollider(colliderHandle);

    let collisionGroups = collider.collisionGroups();

    collisionGroups = removeCollisionGroupMembership(collisionGroups, FocusCollisionGroup);
    collisionGroups = removeCollisionGroupMembership(collisionGroups, GrabCollisionGroup);

    collider.setCollisionGroups(collisionGroups);
  }
}
