import { addComponent, defineComponent, defineQuery, enterQuery } from "bitecs";
import { Object3D, Vector3 } from "three";

import { GameState } from "../engine/GameTypes";
import {
  ActionMap,
  ActionState,
  ActionType,
  BindingType,
  ButtonActionState,
  enableActionMap,
} from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { getInputController, inputControllerQuery } from "../engine/input/InputController";
import { defineModule, getModule } from "../engine/module/module.common";
import { isHost } from "../engine/network/network.common";
import { NetworkModule } from "../engine/network/network.game";
import { RemoteNodeComponent } from "../engine/node/RemoteNodeComponent";
import { PhysicsModule, PhysicsModuleState, RigidBody } from "../engine/physics/physics.game";
import { RemoteNode } from "../engine/resource/resource.game";

function kinematicCharacterControllerAction(key: string) {
  return "KinematicCharacterController/" + key;
}

export const KinematicCharacterControllerActions = {
  Move: kinematicCharacterControllerAction("Move"),
  Jump: kinematicCharacterControllerAction("Jump"),
  Sprint: kinematicCharacterControllerAction("Sprint"),
  Crouch: kinematicCharacterControllerAction("Crouch"),
};

export const KinematicCharacterControllerActionMap: ActionMap = {
  id: "kinematic-character-controller",
  actionDefs: [
    {
      id: "move",
      path: KinematicCharacterControllerActions.Move,
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
      path: KinematicCharacterControllerActions.Jump,
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
      path: KinematicCharacterControllerActions.Crouch,
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
      path: KinematicCharacterControllerActions.Sprint,
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

type KinematicCharacterControllerModuleState = {};

export const KinematicCharacterControllerModule = defineModule<GameState, KinematicCharacterControllerModuleState>({
  name: "kinematic-character-controller",
  create() {
    return {};
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);
    const controller = input.defaultController;
    enableActionMap(controller, KinematicCharacterControllerActionMap);
  },
});

export const KinematicControls = defineComponent();
export const kinematicControlsQuery = defineQuery([KinematicControls]);
export const enteredKinematicControlsQuery = enterQuery(kinematicControlsQuery);

const obj = new Object3D();

const walkSpeed = 200;
const drag = 30;
const maxWalkSpeed = 1000;
const maxSprintSpeed = 1000;
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
let isSliding = false;
const slideForce = new Vector3();
let lastSlideTime = 0;

export function addKinematicControls(ctx: GameState, eid: number) {
  addComponent(ctx.world, KinematicControls, eid);
}

function updateKinematicControls(
  ctx: GameState,
  { physicsWorld, characterController }: PhysicsModuleState,
  actionStates: Map<string, ActionState>,
  rig: RemoteNode
) {
  const body = RigidBody.store.get(rig.eid);
  if (!body) {
    return;
  }

  obj.quaternion.fromArray(rig.quaternion);
  body.setNextKinematicRotation(obj.quaternion);

  // Handle Input
  const moveVec = actionStates.get(KinematicCharacterControllerActions.Move) as Float32Array;
  const jump = actionStates.get(KinematicCharacterControllerActions.Jump) as ButtonActionState;
  const crouch = actionStates.get(KinematicCharacterControllerActions.Crouch) as ButtonActionState;
  const sprint = actionStates.get(KinematicCharacterControllerActions.Sprint) as ButtonActionState;

  linearVelocity.copy(body.linvel() as Vector3);

  const isGrounded = characterController.computedGrounded();
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

  moveForce.add(physicsWorld.gravity as Vector3);

  moveForce.multiplyScalar(ctx.dt);

  const translation = body.translation();

  const collider = body.collider(0);

  characterController.computeColliderMovement(collider, moveForce);

  const corrected = characterController.computedMovement();

  // console.log("translation before", translation);
  translation.x += corrected.x;
  translation.y += corrected.y;
  translation.z += corrected.z;
  // console.log("translation after", translation);

  body.setNextKinematicTranslation(translation);
}

export const KinematicCharacterControllerSystem = (ctx: GameState) => {
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);

  if (network.authoritative && !isHost(network) && !network.clientSidePrediction) {
    return;
  }

  const rigs = inputControllerQuery(ctx.world);
  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const node = RemoteNodeComponent.get(eid)!;
    const controller = getInputController(input, eid);

    // if not hosting
    if (network.authoritative && !isHost(network)) {
      // reapply all inputs since last host-processed input
      // which will ideally predict us into the same place as we are on the host
      for (let j = 0; j < controller.history.length; j++) {
        const [, actionStates] = controller.history[j];
        // console.log("reapplying input for tick:", tick);
        // console.log("current tick:", ctx.tick);
        updateKinematicControls(ctx, physics, actionStates, node);
      }
    } else {
      // if hosting or p2p, only apply inputs once
      updateKinematicControls(ctx, physics, controller.actionStates, node);
    }
    // console.log("=============");
  }
};
