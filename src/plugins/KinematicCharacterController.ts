import { addComponent, defineComponent, defineQuery, enterQuery } from "bitecs";
import RAPIER from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";

import type { RawCharacterCollision } from "@dimforge/rapier3d-compat/rapier_wasm3d";
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
import { getInputController } from "../engine/input/InputController";
import { defineModule, getModule } from "../engine/module/module.common";
import { isHost } from "../engine/network/network.common";
import { NetworkModule } from "../engine/network/network.game";
import { PhysicsModule, PhysicsModuleState, RigidBody } from "../engine/physics/physics.game";
import { tryGetRemoteResource } from "../engine/resource/resource.game";
import { RemoteNode } from "../engine/resource/RemoteResources";
import { getCamera } from "../engine/camera/camera.game";
import { playAudio } from "../engine/audio/audio.game";
import randomRange from "../engine/utils/randomRange";

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

const _q = new Quaternion();

const walkAccel = 100;
const drag = 10;
const maxWalkSpeed = 20;
const maxSprintSpeed = 50;
const sprintModifier = 2.5;
const jumpForce = 7;
const inAirModifier = 0.5;
const inAirDrag = 6;
const crouchModifier = 0.7;
const crouchJumpModifier = 1.5;
const minSlideSpeed = 3;
const slideModifier = 50;
const slideDrag = 150;
const slideCooldown = 1;

const _acceleration = new Vector3();
const _dragForce = new Vector3();
const _linearVelocity = new Vector3();
let isSliding = false;
const _slideForce = new Vector3();
let lastSlideTime = 0;

let lastFootstepFrame = 0;

export function addKinematicControls(ctx: GameState, eid: number) {
  addComponent(ctx.world, KinematicControls, eid);
}

function updateKinematicControls(
  ctx: GameState,
  { physicsWorld, collisionHandlers, handleToEid, characterCollision, eidTocharacterController }: PhysicsModuleState,
  actionStates: Map<string, ActionState>,
  rig: RemoteNode,
  body: RAPIER.RigidBody
) {
  _q.fromArray(rig.quaternion);
  body.setNextKinematicRotation(_q);

  const characterController = eidTocharacterController.get(rig.eid)!;

  // Handle Input
  const moveVec = actionStates.get(KinematicCharacterControllerActions.Move) as Float32Array;
  const jump = actionStates.get(KinematicCharacterControllerActions.Jump) as ButtonActionState;
  const crouch = actionStates.get(KinematicCharacterControllerActions.Crouch) as ButtonActionState;
  const sprint = actionStates.get(KinematicCharacterControllerActions.Sprint) as ButtonActionState;

  _linearVelocity.copy(body.linvel() as Vector3);

  // HACK - for when autostep misbehaves and spikes Y velocity
  if (_linearVelocity.y > 10) {
    _linearVelocity.y = 1;
  }

  const isGrounded = characterController.computedGrounded();
  const isSprinting = isGrounded && sprint.held && !isSliding;

  const speed = Math.sqrt(_linearVelocity.x * _linearVelocity.x + _linearVelocity.z * _linearVelocity.z);

  _acceleration.set(moveVec[0], 0, -moveVec[1]).normalize().applyQuaternion(_q).multiplyScalar(walkAccel);

  if (!isGrounded) {
    _acceleration.multiplyScalar(inAirModifier);
  } else {
    if (crouch.held && !isSliding) {
      _acceleration.multiplyScalar(crouchModifier);
    } else if (sprint.held && !isSliding) {
      _acceleration.multiplyScalar(sprintModifier);
    }
  }

  if (isSprinting) {
    _acceleration.clampLength(0, maxSprintSpeed);
  } else {
    _acceleration.clampLength(0, maxWalkSpeed);
  }

  if (isGrounded) {
    _acceleration.y = 0;
  } else {
    _acceleration.y = physicsWorld.gravity.y * 1.5;
  }

  // TODO: Check to see if velocity matches orientation before sliding
  if (crouch.pressed && speed > minSlideSpeed && isGrounded && !isSliding && ctx.dt > lastSlideTime + slideCooldown) {
    _slideForce.set(0, 0, (speed + 1) * -slideModifier).applyQuaternion(_q);
    _acceleration.add(_slideForce);
    isSliding = true;
    lastSlideTime = ctx.elapsed;
  } else if (crouch.released || ctx.dt > lastSlideTime + slideCooldown) {
    isSliding = false;
  }

  if (jump.pressed && isGrounded) {
    const jumpModifier = crouch.held ? crouchJumpModifier : 1;
    _linearVelocity.y += jumpForce * jumpModifier;
  }

  if (speed !== 0) {
    let dragMultiplier = drag;

    if (isSliding) {
      dragMultiplier = slideDrag;
    } else if (!isGrounded) {
      dragMultiplier = sprint.held ? inAirDrag / 1.5 : inAirDrag;
    }

    _dragForce.copy(_linearVelocity).negate().multiplyScalar(dragMultiplier);

    _dragForce.y = 0;

    _acceleration.add(_dragForce);
  }

  if (speed > 0.1 && isGrounded) {
    // camera bob
    const camera = getCamera(ctx, rig);
    const amplitude = 0.04;
    const time = ctx.elapsed;
    const frequency = isSprinting ? 0.003 : 0.0015; // radians per second
    const phase = 0;
    const delta = amplitude * Math.sin(2 * Math.PI * time * frequency + phase);
    camera.position[1] = -delta;

    if (delta > 0.039 && ctx.tick > lastFootstepFrame + 10) {
      // footstep
      const audioSources = rig.audioEmitter!.sources.filter((s) => s.audio?.uri.includes("footstep"));
      if (audioSources.length) {
        const i = Math.floor(randomRange(0, audioSources.length));
        playAudio(audioSources[i], { playbackRate: randomRange(0.6, 0.9), gain: 0.2 });
      }
      lastFootstepFrame = ctx.tick;
    }
  }

  _acceleration.multiplyScalar(ctx.dt);

  _linearVelocity.add(_acceleration).multiplyScalar(ctx.dt);

  const translation = body.nextTranslation();

  const collider = body.collider(0);

  characterController.computeColliderMovement(collider, _linearVelocity);

  const corrected = characterController.computedMovement();

  translation.x += corrected.x;
  translation.y += corrected.y;
  translation.z += corrected.z;

  body.setNextKinematicTranslation(translation);

  for (let i = 0; i < characterController.numComputedCollisions(); i++) {
    if (characterController.computedCollision(i, characterCollision) !== null) {
      // TODO: Rapier v0.10.0 doesn't expose collider on characterCollision so manually grab it
      const rawCollision = (characterController as any).rawCharacterCollision as RawCharacterCollision;
      const collisionColliderHandle = rawCollision.handle();
      const collisionCollider = physicsWorld.getCollider(collisionColliderHandle);

      if (!collisionCollider) {
        return;
      }

      const collisionColliderEid = handleToEid.get(collisionColliderHandle);

      if (!collisionColliderEid) {
        continue;
      }

      for (const collisionHandler of collisionHandlers) {
        collisionHandler(rig.eid, collisionColliderEid, collider.handle, collisionColliderHandle);
      }
    }
  }
}

export const KinematicCharacterControllerSystem = (ctx: GameState) => {
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);

  if (network.authoritative && !isHost(network) && !network.clientSidePrediction) {
    return;
  }

  const entered = enteredKinematicControlsQuery(ctx.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const characterController = physics.physicsWorld.createCharacterController(0.1);
    characterController.enableAutostep(0.2, 0.2, true);
    characterController.enableSnapToGround(0.3);
    characterController.setApplyImpulsesToDynamicBodies(true);
    physics.eidTocharacterController.set(eid, characterController);
  }

  const rigs = kinematicControlsQuery(ctx.world);

  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const controller = getInputController(input, eid);
    const body = RigidBody.store.get(eid);

    if (!body) {
      throw new Error("rigidbody not found on eid " + eid);
    }

    // if not hosting
    if (network.authoritative && !isHost(network)) {
      // reapply all inputs since last host-processed input
      // which will ideally predict us into the same place as we are on the host
      for (let j = 0; j < controller.history.length; j++) {
        const [, actionStates] = controller.history[j];
        // console.log("reapplying input for tick:", tick);
        // console.log("current tick:", ctx.tick);
        updateKinematicControls(ctx, physics, actionStates, node, body);
      }
    } else {
      // if hosting or p2p, only apply inputs once
      updateKinematicControls(ctx, physics, controller.actionStates, node, body);
    }
    // console.log("=============");
  }
};
