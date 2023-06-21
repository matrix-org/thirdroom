import { addComponent, defineComponent, defineQuery, enterQuery } from "bitecs";
import RAPIER from "@dimforge/rapier3d-compat";
import { RawCharacterCollision } from "@dimforge/rapier3d-compat/raw";
import { Quaternion, Vector3 } from "three";

import { GameContext } from "../GameTypes";
import { enableActionMap } from "../input/ActionMappingSystem";
import { ActionMap, ActionState, ActionType, BindingType, ButtonActionState } from "../input/ActionMap";
import { InputModule } from "../input/input.game";
import { defineModule, getModule } from "../module/module.common";
import { PhysicsModule, PhysicsModuleState } from "../physics/physics.game";
import { tryGetRemoteResource } from "../resource/resource.game";
import { RemoteNode } from "../resource/RemoteResources";
import { playOneShotAudio } from "../audio/audio.game";
import randomRange from "../utils/randomRange";

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
        {
          type: BindingType.Axes,
          x: "XRInputSource/secondary/xr-standard-thumbstick/x-axis",
          y: "XRInputSource/secondary/xr-standard-thumbstick/y-axis",
        },
      ],
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
        {
          type: BindingType.Button,
          path: "XRInputSource/primary/xr-standard-thumbstick/button",
        },
      ],
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
        {
          type: BindingType.Button,
          path: "XRInputSource/secondary/xr-standard-thumbstick/button",
        },
      ],
    },
  ],
};

type KinematicCharacterControllerModuleState = {};

export const KinematicCharacterControllerModule = defineModule<GameContext, KinematicCharacterControllerModuleState>({
  name: "kinematic-character-controller",
  create() {
    return {};
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);
    enableActionMap(input, KinematicCharacterControllerActionMap);
  },
});

export const KinematicControls = defineComponent();
export const kinematicControlsQuery = defineQuery([KinematicControls]);
export const enteredKinematicControlsQuery = enterQuery(kinematicControlsQuery);

export const _q = new Quaternion();

export const walkAccel = 100;
export const drag = 10;
export const maxWalkSpeed = 20;
export const maxSprintSpeed = 50;
export const sprintModifier = 2.5;
export const jumpForce = 7;
export const inAirModifier = 0.5;
export const inAirDrag = 6;
export const crouchModifier = 0.7;
export const crouchJumpModifier = 1.5;
export const minSlideSpeed = 3;
export const slideModifier = 50;
export const slideDrag = 150;
export const slideCooldown = 1;

export const _acceleration = new Vector3();
export const _dragForce = new Vector3();
export const _linearVelocity = new Vector3();
export let isSliding = false;
export const _slideForce = new Vector3();
export let lastSlideTime = 0;

let lastFootstepFrame = 0;

export function addKinematicControls(ctx: GameContext, eid: number) {
  addComponent(ctx.world, KinematicControls, eid);
}

function cameraHeadBob(ctx: GameContext, rig: RemoteNode, speed: number, isGrounded: boolean, isSprinting: boolean) {
  if (speed > 0.1 && isGrounded) {
    const amplitude = 0.04;
    const time = ctx.elapsed;
    const frequency = isSprinting ? 0.003 : 0.0015; // radians per second
    const phase = 0;
    const delta = amplitude * Math.sin(2 * Math.PI * time * frequency + phase);

    if (delta > 0.039 && ctx.tick > lastFootstepFrame + 10) {
      // footstep
      const audioSources = rig.audioEmitter!.sources.filter((s) => s.audio?.uri.includes("footstep"));
      if (audioSources.length) {
        const i = Math.floor(randomRange(0, audioSources.length));
        playOneShotAudio(ctx, audioSources[i], 0.2, randomRange(0.6, 0.9));
      }
      lastFootstepFrame = ctx.tick;
    }
  }
}

export function updateKinematicControls(
  ctx: GameContext,
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

  _acceleration.y = physicsWorld.gravity.y * 1.5;

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

  cameraHeadBob(ctx, rig, speed, isGrounded, isSprinting);

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
        collisionHandler(rig.eid, collisionColliderEid, collider.handle, collisionColliderHandle, true);
      }
    }
  }
}

function createCharacterController(physics: PhysicsModuleState, eid: number) {
  const characterController = physics.physicsWorld.createCharacterController(0.01);
  characterController.enableAutostep(0.1, 0.1, true);
  characterController.enableSnapToGround(0.1);
  characterController.setCharacterMass(100);
  characterController.setApplyImpulsesToDynamicBodies(true);
  characterController.setSlideEnabled(true);

  physics.eidTocharacterController.set(eid, characterController);
  return characterController;
}

export const KinematicCharacterControllerSystem = (ctx: GameContext) => {
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);

  const entered = enteredKinematicControlsQuery(ctx.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    createCharacterController(physics, eid);
  }

  const rigs = kinematicControlsQuery(ctx.world);

  for (let i = 0; i < rigs.length; i++) {
    const eid = rigs[i];
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const body = node.physicsBody?.body;

    if (!body) {
      console.warn("skipping kinematic controller - rigidbody not found on eid " + eid);
      continue;
    }

    updateKinematicControls(ctx, physics, input.actionStates, node, body);
  }
};
