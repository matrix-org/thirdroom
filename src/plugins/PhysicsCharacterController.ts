import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, defineComponent, defineQuery, enterQuery } from "bitecs";
import { Object3D, Quaternion, Vector3 } from "three";

import { GameState } from "../engine/GameTypes";
import { enableActionMap } from "../engine/input/ActionMappingSystem";
import { ActionMap, ActionType, BindingType, ButtonActionState } from "../engine/input/ActionMap";
import { InputModule } from "../engine/input/input.game";
import { tryGetInputController, InputController, inputControllerQuery } from "../engine/input/InputController";
import { defineModule, getModule } from "../engine/module/module.common";
import { isHost } from "../engine/network/network.common";
import { NetworkModule } from "../engine/network/network.game";
import { playerShapeCastCollisionGroups } from "../engine/physics/CollisionGroups";
import { PhysicsModule, PhysicsModuleState, RigidBody } from "../engine/physics/physics.game";
import { tryGetRemoteResource } from "../engine/resource/resource.game";
import { RemoteNode } from "../engine/resource/RemoteResources";

function physicsCharacterControllerAction(key: string) {
  return "PhysicsCharacterController/" + key;
}

export const PhysicsCharacterControllerActions = {
  Move: physicsCharacterControllerAction("Move"),
  Jump: physicsCharacterControllerAction("Jump"),
  Sprint: physicsCharacterControllerAction("Sprint"),
  Crouch: physicsCharacterControllerAction("Crouch"),
};

export const PhysicsCharacterControllerActionMap: ActionMap = {
  id: "physics-character-controller",
  actionDefs: [
    {
      id: "move",
      path: PhysicsCharacterControllerActions.Move,
      type: ActionType.Vector2,
      bindings: [
        {
          type: BindingType.DirectionalButtons,
          up: "Keyboard/KeyW",
          down: "Keyboard/KeyS",
          left: "Keyboard/KeyA",
          right: "Keyboard/KeyD",
        },
      ],
      networked: true,
    },
    {
      id: "jump",
      path: PhysicsCharacterControllerActions.Jump,
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/Space",
        },
      ],
      networked: true,
    },
    {
      id: "crouch",
      path: PhysicsCharacterControllerActions.Crouch,
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyC",
        },
      ],
      networked: true,
    },
    {
      id: "sprint",
      path: PhysicsCharacterControllerActions.Sprint,
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/ShiftLeft",
        },
      ],
      networked: true,
    },
  ],
};

type PhysicsCharacterControllerModuleState = {};

export const PhysicsCharacterControllerModule = defineModule<GameState, PhysicsCharacterControllerModuleState>({
  name: "physics-character-controller",
  create() {
    return {};
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);
    const controller = input.defaultController;
    enableActionMap(controller, PhysicsCharacterControllerActionMap);
  },
});

export const PhysicsControls = defineComponent();
export const physicsControlsQuery = defineQuery([PhysicsControls]);
export const enteredPhysicsControlsQuery = enterQuery(physicsControlsQuery);

const obj = new Object3D();

const walkSpeed = 70;
const drag = 30;
const maxWalkSpeed = 100;
const maxSprintSpeed = 100;
const sprintModifier = 2.5;
const jumpForce = 7;
const inAirModifier = 0.5;
const inAirDrag = 8;
const crouchModifier = 0.7;
const crouchJumpModifier = 1.5;
const minSlideSpeed = 3;
const slideModifier = 50;
const slideDrag = 150;
const slideCooldown = 1;

const moveForce = new Vector3();
const dragForce = new Vector3();
const linearVelocity = new Vector3();
const shapeCastPosition = new Vector3();
const shapeCastRotation = new Quaternion();
let isSliding = false;
const slideForce = new Vector3();
let lastSlideTime = 0;

const colliderShape = new RAPIER.Capsule(0.1, 0.5);

const shapeTranslationOffset = new Vector3(0, 0, 0);
const shapeRotationOffset = new Quaternion(0, 0, 0, 0);

export function addPhysicsControls(ctx: GameState, eid: number) {
  addComponent(ctx.world, PhysicsControls, eid);
}

function updatePhysicsControls(
  ctx: GameState,
  { physicsWorld }: PhysicsModuleState,
  controller: InputController,
  rig: RemoteNode
) {
  const body = RigidBody.store.get(rig.eid);
  if (!body) {
    return;
  }

  obj.quaternion.fromArray(rig.quaternion);
  body.setRotation(obj.quaternion, true);

  // Handle Input
  const moveVec = controller.actionStates.get(PhysicsCharacterControllerActions.Move) as Float32Array;
  const jump = controller.actionStates.get(PhysicsCharacterControllerActions.Jump) as ButtonActionState;
  const crouch = controller.actionStates.get(PhysicsCharacterControllerActions.Crouch) as ButtonActionState;
  const sprint = controller.actionStates.get(PhysicsCharacterControllerActions.Sprint) as ButtonActionState;

  linearVelocity.copy(body.linvel() as Vector3);

  shapeCastPosition.copy(body.translation() as Vector3).add(shapeTranslationOffset);
  shapeCastRotation.copy(obj.quaternion).multiply(shapeRotationOffset);

  // todo: tune interaction groups
  const shapeCastResult = physicsWorld.castShape(
    shapeCastPosition,
    shapeCastRotation,
    physicsWorld.gravity,
    colliderShape,
    ctx.dt * 6,
    true,
    0,
    playerShapeCastCollisionGroups
  );

  const isGrounded = !!shapeCastResult;
  const isSprinting = isGrounded && sprint.held && !isSliding;

  const speed = linearVelocity.length();
  const maxSpeed = isSprinting ? maxSprintSpeed : maxWalkSpeed;

  if (speed < maxSpeed) {
    moveForce
      .set(moveVec[0], 0, -moveVec[1])
      .normalize()
      .applyQuaternion(obj.quaternion)
      .multiplyScalar(walkSpeed * ctx.dt);

    if (!isGrounded) {
      moveForce.multiplyScalar(inAirModifier);
    } else if (isGrounded && crouch.held && !isSliding) {
      moveForce.multiplyScalar(crouchModifier);
    } else if (isGrounded && sprint.held && !isSliding) {
      moveForce.multiplyScalar(sprintModifier);
    }
  }

  // TODO: Check to see if velocity matches orientation before sliding
  if (crouch.pressed && speed > minSlideSpeed && isGrounded && !isSliding && ctx.dt > lastSlideTime + slideCooldown) {
    slideForce.set(0, 0, (speed + 1) * -slideModifier).applyQuaternion(obj.quaternion);
    moveForce.add(slideForce);
    isSliding = true;
    lastSlideTime = ctx.elapsed;
  } else if (crouch.released || ctx.dt > lastSlideTime + slideCooldown) {
    isSliding = false;
  }

  if (speed !== 0) {
    let dragMultiplier = drag;

    if (isSliding) {
      dragMultiplier = slideDrag;
    } else if (!isGrounded) {
      dragMultiplier = inAirDrag;
    }

    dragForce
      .copy(linearVelocity)
      .negate()
      .multiplyScalar(dragMultiplier * ctx.dt);

    dragForce.y = 0;

    moveForce.add(dragForce);
  }

  if (jump.pressed && isGrounded) {
    const jumpModifier = crouch.held ? crouchJumpModifier : 1;
    moveForce.y += jumpForce * jumpModifier;
  }

  body.applyImpulse(moveForce, true);
}

export const PhysicsCharacterControllerSystem = (ctx: GameState) => {
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);

  if (network.authoritative && !isHost(network) && !network.clientSidePrediction) {
    return;
  }

  const rigs = inputControllerQuery(ctx.world);
  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const controller = tryGetInputController(input, eid);
    updatePhysicsControls(ctx, physics, controller, node);
  }
};
