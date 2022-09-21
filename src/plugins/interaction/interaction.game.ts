import RAPIER from "@dimforge/rapier3d-compat";
import {
  defineComponent,
  Types,
  defineQuery,
  removeComponent,
  addComponent,
  hasComponent,
  enterQuery,
  exitQuery,
} from "bitecs";
import { vec3, mat4, quat } from "gl-matrix";
import { Quaternion, Vector3, Vector4 } from "three";

import { Transform } from "../../engine/component/transform";
import { NOOP } from "../../engine/config.common";
import { GameState } from "../../engine/GameTypes";
import {
  enableActionMap,
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
} from "../../engine/input/ActionMappingSystem";
import { InputModule } from "../../engine/input/input.game";
import { defineModule, getModule, Thread } from "../../engine/module/module.common";
import { getPeerIdIndexFromNetworkId, Networked, NetworkModule } from "../../engine/network/network.game";
import { takeOwnership } from "../../engine/network/ownership.game";
import {
  addCollisionGroupMembership,
  FocusCollisionGroup,
  focusShapeCastCollisionGroups,
  GrabCollisionGroup,
  grabShapeCastCollisionGroups,
} from "../../engine/physics/CollisionGroups";
import { PhysicsModule, RigidBody } from "../../engine/physics/physics.game";
import { Prefab } from "../../engine/prefab/prefab.game";
import { PortalComponent } from "../portals/portals.game";
import { InteractableAction, InteractableType, InteractionMessage, InteractionMessageType } from "./interaction.common";

type InteractionModuleState = {};

export const InteractionModule = defineModule<GameState, InteractionModuleState>({
  name: "interaction",
  create() {
    return {};
  },
  init(ctx) {
    enableActionMap(ctx, InteractionActionMap);
  },
});

export const InteractionActionMap: ActionMap = {
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
  ],
};

export const Interactable = defineComponent({
  type: Types.ui8,
});

const FocusComponent = defineComponent();

export const GrabComponent = defineComponent({
  handle1: Types.ui32,
  handle2: Types.ui32,
  joint: [Types.f32, 3],
});

const focusQuery = defineQuery([FocusComponent]);
const enterFocusQuery = enterQuery(focusQuery);
const exitFocusQuery = exitQuery(focusQuery);
const grabQuery = defineQuery([GrabComponent]);

const MAX_FOCUS_DISTANCE = 3.3;
const HELD_DISTANCE = 2.5;
const GRAB_DISTANCE = 3.3;
const GRAB_MOVE_SPEED = 10;
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

export function InteractionSystem(ctx: GameState) {
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);

  // Focus

  // raycast outward from camera
  const cameraMatrix = Transform.worldMatrix[ctx.activeCamera];
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
    1.0,
    focusShapeCastCollisionGroups
  );

  let eid;

  if (hit !== null) {
    eid = physics.handleToEid.get(hit.colliderHandle);
    if (!eid) {
      console.warn(`Could not find entity for physics handle ${hit.colliderHandle}`);
    } else if (eid !== focusQuery(ctx.world)[0]) {
      focusQuery(ctx.world).forEach((eid) => removeComponent(ctx.world, FocusComponent, eid));
      addComponent(ctx.world, FocusComponent, eid);
    }
  } else {
    // clear focus
    focusQuery(ctx.world).forEach((eid) => removeComponent(ctx.world, FocusComponent, eid));
  }

  const entered = enterFocusQuery(ctx.world);

  if (entered[0]) sendInteractionMessage(ctx, InteractableAction.Focus, eid);

  const exited = exitFocusQuery(ctx.world);

  if (exited[0] && focusQuery(ctx.world).length === 0) sendInteractionMessage(ctx, InteractableAction.Unfocus);

  // Grab / Throw
  let heldEntity = grabQuery(ctx.world)[0];

  const grabBtn = input.actions.get("Grab") as ButtonActionState;
  const grabBtn2 = input.actions.get("Grab2") as ButtonActionState;
  const throwBtn = input.actions.get("Throw") as ButtonActionState;
  const throwBtn2 = input.actions.get("Throw2") as ButtonActionState;

  const grabPressed = grabBtn.pressed || grabBtn2.pressed;
  const throwPressed = throwBtn.pressed || throwBtn2.pressed;

  // if holding and entity and throw is pressed
  if (heldEntity && throwPressed) {
    removeComponent(ctx.world, GrabComponent, heldEntity);

    mat4.getRotation(_cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(_direction, 0, 0, -1);
    vec3.transformQuat(direction, direction, _cameraWorldQuat);
    vec3.scale(direction, direction, THROW_FORCE);

    // fire!
    _impulse.fromArray(direction);
    RigidBody.store.get(heldEntity)?.applyImpulse(_impulse, true);

    sendInteractionMessage(ctx, InteractableAction.Release, heldEntity);

    // if holding an entity and grab is pressed again
  } else if (grabPressed && heldEntity) {
    // release
    removeComponent(ctx.world, GrabComponent, heldEntity);
    sendInteractionMessage(ctx, InteractableAction.Release, heldEntity);

    // if grab is pressed
  } else if (grabPressed) {
    // raycast outward from camera
    const cameraMatrix = Transform.worldMatrix[ctx.activeCamera];
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
      1.0,
      grabShapeCastCollisionGroups
    );

    if (shapecastHit !== null) {
      const eid = physics.handleToEid.get(shapecastHit.colliderHandle);

      if (!eid) {
        console.warn(`Could not find entity for physics handle ${shapecastHit.colliderHandle}`);
      } else {
        if (Interactable.type[eid] === InteractableType.Object) {
          const newEid = takeOwnership(ctx, eid);

          if (newEid !== NOOP) {
            addComponent(ctx.world, GrabComponent, newEid);
            sendInteractionMessage(ctx, InteractableAction.Grab, newEid);
            heldEntity = newEid;
          } else {
            addComponent(ctx.world, GrabComponent, eid);
            sendInteractionMessage(ctx, InteractableAction.Grab, eid);
          }
        } else {
          sendInteractionMessage(ctx, InteractableAction.Grab, eid);
        }
      }
    }
  }

  // if still holding entity, move towards the held point
  heldEntity = grabQuery(ctx.world)[0];
  if (heldEntity) {
    const heldPosition = Transform.position[heldEntity];

    const target = _target;
    mat4.getTranslation(target, Transform.worldMatrix[ctx.activeCamera]);

    mat4.getRotation(_cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(_direction, 0, 0, 1);
    vec3.transformQuat(direction, direction, _cameraWorldQuat);
    vec3.scale(direction, direction, HELD_DISTANCE);

    vec3.sub(target, target, direction);

    vec3.sub(target, target, heldPosition);

    vec3.scale(target, target, GRAB_MOVE_SPEED);

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

    if (interactableType === InteractableType.Object || interactableType === InteractableType.Player) {
      peerId = network.entityIdToPeerId.get(eid);
    }

    let ownerId;

    if (interactableType === InteractableType.Object) {
      const ownerIdIndex = getPeerIdIndexFromNetworkId(Networked.networkId[eid]);
      ownerId = network.indexToPeerId.get(ownerIdIndex);
    }

    let uri;

    if (interactableType === InteractableType.Portal) {
      uri = PortalComponent.get(eid)?.uri;
    }

    ctx.sendMessage<InteractionMessage>(Thread.Main, {
      type: InteractionMessageType,
      interactableType,
      name: Prefab.get(eid),
      held: hasComponent(ctx.world, GrabComponent, eid),
      action,
      peerId,
      ownerId,
      uri,
    });
  }
}

export function addInteractableComponent(ctx: GameState, eid: number, interactableType: InteractableType) {
  addComponent(ctx.world, Interactable, eid);
  Interactable.type[eid] = interactableType;

  const { physicsWorld } = getModule(ctx, PhysicsModule);

  const rigidBody = RigidBody.store.get(eid);

  if (rigidBody) {
    for (let i = 0; i < rigidBody.numColliders(); i++) {
      const colliderHandle = rigidBody.collider(i);
      const collider = physicsWorld.getCollider(colliderHandle);

      let collisionGroups = collider.collisionGroups();

      collisionGroups = addCollisionGroupMembership(collisionGroups, FocusCollisionGroup);
      collisionGroups = addCollisionGroupMembership(collisionGroups, GrabCollisionGroup);

      collider.setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS);
      collider.setCollisionGroups(collisionGroups);
    }
  } else {
    console.warn(
      `Adding interactable component to entity "${eid}" without a RigidBody component. This entity will not be interactable.`
    );
  }
}
