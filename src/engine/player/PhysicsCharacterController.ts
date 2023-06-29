import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, defineComponent, defineQuery, enterQuery } from "bitecs";
import { Object3D, Quaternion, Vector3 } from "three";

import { GameContext } from "../GameTypes";
import { enableActionMap } from "../input/ActionMappingSystem";
import { ActionMap, ActionType, BindingType, ButtonActionState } from "../input/ActionMap";
import { InputModule } from "../input/input.game";
import { defineModule, getModule } from "../module/module.common";
import { playerShapeCastCollisionGroups } from "../physics/CollisionGroups";
import { PhysicsModule } from "../physics/physics.game";
import { tryGetRemoteResource } from "../resource/resource.game";
import { RemoteNode } from "../resource/RemoteResources";
import { ourPlayerQuery } from "./Player";

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
    },
  ],
};

type PhysicsCharacterControllerModuleState = {};

export const PhysicsCharacterControllerModule = defineModule<GameContext, PhysicsCharacterControllerModuleState>({
  name: "physics-character-controller",
  create() {
    return {};
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);
    enableActionMap(input, PhysicsCharacterControllerActionMap);
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

export function addPhysicsControls(ctx: GameContext, eid: number) {
  addComponent(ctx.world, PhysicsControls, eid);
}

export const PhysicsCharacterControllerSystem = (ctx: GameContext) => {
  const { physicsWorld } = getModule(ctx, PhysicsModule);
  const { actionStates } = getModule(ctx, InputModule);
  const eid = ourPlayerQuery(ctx.world)[0];

  if (!eid) {
    return;
  }

  const rig = tryGetRemoteResource<RemoteNode>(ctx, eid);

  const body = rig.physicsBody?.body;
  if (!body) {
    return;
  }

  obj.quaternion.fromArray(rig.quaternion);
  body.setRotation(obj.quaternion, true);

  // Handle Input
  const moveVec = actionStates.get(PhysicsCharacterControllerActions.Move) as Float32Array;
  const jump = actionStates.get(PhysicsCharacterControllerActions.Jump) as ButtonActionState;
  const crouch = actionStates.get(PhysicsCharacterControllerActions.Crouch) as ButtonActionState;
  const sprint = actionStates.get(PhysicsCharacterControllerActions.Sprint) as ButtonActionState;

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
};
