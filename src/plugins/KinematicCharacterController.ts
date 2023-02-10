import { addComponent, defineComponent, defineQuery, enterQuery, Not } from "bitecs";
import RAPIER from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";
import { vec3 } from "gl-matrix";

import { GameState } from "../engine/GameTypes";
import { enableActionMap } from "../engine/input/ActionMappingSystem";
import { ActionMap, ActionState, ActionType, BindingType, ButtonActionState } from "../engine/input/ActionMap";
import { InputModule } from "../engine/input/input.game";
import { tryGetInputController } from "../engine/input/InputController";
import { defineModule, getModule } from "../engine/module/module.common";
import { isHost } from "../engine/network/network.common";
import { NetworkModule } from "../engine/network/network.game";
import { Networked, Owned } from "../engine/network/NetworkComponents";
import { PhysicsModule, PhysicsModuleState, RigidBody } from "../engine/physics/physics.game";
import { tryGetRemoteResource } from "../engine/resource/resource.game";
import { RemoteNode } from "../engine/resource/RemoteResources";
import { getCamera } from "../engine/camera/camera.game";
import { playOneShotAudio } from "../engine/audio/audio.game";
import randomRange from "../engine/utils/randomRange";
import { OurPlayer } from "../engine/component/Player";
import { createClientPositionMessage } from "../engine/network/serialization.game";
import { sendReliable } from "../engine/network/outbound.game";

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
      // networked: true,
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
      // networked: true,
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
      // networked: true,
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
      // networked: true,
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
// TODO: remove owned for CSP
export const kinematicControlsQuery = defineQuery([KinematicControls, Owned]);
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

export function addKinematicControls(ctx: GameState, eid: number) {
  addComponent(ctx.world, KinematicControls, eid);
}

function cameraHeadBob(ctx: GameState, rig: RemoteNode, speed: number, isGrounded: boolean, isSprinting: boolean) {
  if (speed > 0.1 && isGrounded) {
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
        playOneShotAudio(ctx, audioSources[i], 0.2, randomRange(0.6, 0.9));
      }
      lastFootstepFrame = ctx.tick;
    }
  }
}

export function updateKinematicControls(
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

  // TODO: computed collisions are bugged, too many are generated, causes hitching
  // for (let i = 0; i < characterController.numComputedCollisions(); i++) {
  //   if (characterController.computedCollision(i, characterCollision) !== null) {
  //     // TODO: Rapier v0.10.0 doesn't expose collider on characterCollision so manually grab it
  //     const rawCollision = (characterController as any).rawCharacterCollision as RawCharacterCollision;
  //     const collisionColliderHandle = rawCollision.handle();
  //     const collisionCollider = physicsWorld.getCollider(collisionColliderHandle);

  //     if (!collisionCollider) {
  //       return;
  //     }

  //     const collisionColliderEid = handleToEid.get(collisionColliderHandle);

  //     if (!collisionColliderEid) {
  //       continue;
  //     }

  //     for (const collisionHandler of collisionHandlers) {
  //       collisionHandler(rig.eid, collisionColliderEid, collider.handle, collisionColliderHandle);
  //     }
  //   }
  // }
}

export const KinematicCharacterControllerSystem = (ctx: GameState) => {
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);

  if (network.authoritative && !isHost(network)) {
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
    const controller = tryGetInputController(input, eid);
    const body = RigidBody.store.get(eid);

    if (!body) {
      console.warn("skipping kinematic controller - rigidbody not found on eid " + eid);
      continue;
    }

    updateKinematicControls(ctx, physics, controller.actionStates, node, body);
  }
};

// client-side prediction
const cspQuery = defineQuery([Networked, KinematicControls, OurPlayer, Not(Owned)]);

// function updateKinematicControlsCsp(
//   ctx: GameState,
//   { physicsWorld, collisionHandlers, handleToEid, characterCollision, eidTocharacterController }: PhysicsModuleState,
//   actionStates: Map<string, ActionState>,
//   rig: RemoteNode,
//   body: RAPIER.RigidBody,
//   entityState: { position: vec3; velocity: vec3 },
//   divisor: number
// ) {
//   const characterController = eidTocharacterController.get(rig.eid)!;

//   // Handle Input
//   const moveVec = actionStates.get(KinematicCharacterControllerActions.Move) as Float32Array;
//   const jump = actionStates.get(KinematicCharacterControllerActions.Jump) as ButtonActionState;
//   const crouch = actionStates.get(KinematicCharacterControllerActions.Crouch) as ButtonActionState;
//   const sprint = actionStates.get(KinematicCharacterControllerActions.Sprint) as ButtonActionState;

//   _linearVelocity.copy(body.linvel() as Vector3);
//   // _linearVelocity.fromArray(entityState.velocity);

//   // // HACK - for when autostep misbehaves and spikes Y velocity
//   if (_linearVelocity.y > 10) {
//     _linearVelocity.y = 1;
//   }

//   const isGrounded = characterController.computedGrounded();
//   const isSprinting = isGrounded && sprint.held && !isSliding;

//   const speed = Math.sqrt(_linearVelocity.x * _linearVelocity.x + _linearVelocity.z * _linearVelocity.z);

//   _acceleration.set(moveVec[0], 0, -moveVec[1]).normalize().applyQuaternion(_q).multiplyScalar(walkAccel);

//   if (!isGrounded) {
//     _acceleration.multiplyScalar(inAirModifier);
//   } else {
//     if (crouch.held && !isSliding) {
//       _acceleration.multiplyScalar(crouchModifier);
//     } else if (sprint.held && !isSliding) {
//       _acceleration.multiplyScalar(sprintModifier);
//     }
//   }

//   if (isSprinting) {
//     _acceleration.clampLength(0, maxSprintSpeed);
//   } else {
//     _acceleration.clampLength(0, maxWalkSpeed);
//   }

//   if (isGrounded) {
//     _acceleration.y = 0;
//   } else {
//     _acceleration.y = physicsWorld.gravity.y * 1.5;
//   }

//   // TODO: Check to see if velocity matches orientation before sliding
//   if (crouch.pressed && speed > minSlideSpeed && isGrounded && !isSliding && ctx.dt > lastSlideTime + slideCooldown) {
//     _slideForce.set(0, 0, (speed + 1) * -slideModifier).applyQuaternion(_q);
//     _acceleration.add(_slideForce);
//     isSliding = true;
//     lastSlideTime = ctx.elapsed;
//   } else if (crouch.released || ctx.dt > lastSlideTime + slideCooldown) {
//     isSliding = false;
//   }

//   if (jump.pressed && isGrounded) {
//     const jumpModifier = crouch.held ? crouchJumpModifier : 1;
//     _linearVelocity.y += jumpForce * jumpModifier;
//   }

//   if (speed !== 0) {
//     let dragMultiplier = drag;

//     if (isSliding) {
//       dragMultiplier = slideDrag;
//     } else if (!isGrounded) {
//       dragMultiplier = sprint.held ? inAirDrag / 1.5 : inAirDrag;
//     }

//     _dragForce.copy(_linearVelocity).negate().multiplyScalar(dragMultiplier);

//     _dragForce.y = 0;

//     _acceleration.add(_dragForce);
//   }

//   cameraHeadBob(ctx, rig, speed, isGrounded, isSprinting);

//   _acceleration.multiplyScalar(ctx.dt);

//   _linearVelocity.add(_acceleration).multiplyScalar(ctx.dt);

//   _linearVelocity.divideScalar(divisor);

//   const translation = body.nextTranslation();

//   const collider = body.collider(0);

//   characterController.computeColliderMovement(collider, _linearVelocity);

//   const corrected = characterController.computedMovement();

//   // console.log("_linearVelocity", _linearVelocity);
//   // console.log("corrected", corrected);

//   translation.x += corrected.x;
//   translation.y += corrected.y;
//   translation.z += corrected.z;

//   body.setNextKinematicTranslation(translation);
// }

export function ClientSidePredictionSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  const haveConnectedPeers = network.peers.length > 0;
  const authNet = network.authoritative;
  const hosting = authNet && isHost(network);
  const cspEnabled = network.clientSidePrediction;

  if (!haveConnectedPeers) return;
  if (!authNet) return;
  if (!cspEnabled) return;
  if (hosting) return;

  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);

  const eid = cspQuery(ctx.world)[0];
  if (!eid) return;

  // TODO: enter cspQuery
  let characterController = physics.eidTocharacterController.get(eid);
  if (!characterController) {
    characterController = physics.physicsWorld.createCharacterController(0.1);
    characterController.enableAutostep(0.2, 0.2, true);
    characterController.enableSnapToGround(0.3);
    characterController.setApplyImpulsesToDynamicBodies(true);
    physics.eidTocharacterController.set(eid, characterController);
  }

  const node = tryGetRemoteResource<RemoteNode>(ctx, eid);

  const body = RigidBody.store.get(eid);
  if (!body) {
    console.warn("skipping CSP - rigidbody not found on eid " + eid);
    return;
  }

  // set our own rotation
  // _q.fromArray(node.quaternion);
  // body.setNextKinematicRotation(_q);

  const controller = tryGetInputController(input, eid);

  updateKinematicControls(ctx, physics, controller.actionStates, node, body);

  const k = 0;
  if ((controller as any).needsUpdate && controller.outbound.history[k]) {
    (controller as any).needsUpdate = false;

    const serverPosition = Networked.position[eid];
    const serverVelocity = Networked.velocity[eid];

    const [, pastState] = controller.outbound.history[k];
    const threshold = 0.0005;

    // compare auth position to tick-equivalent position from the history
    const dist = vec3.dist(serverPosition, pastState.position);
    if (dist > threshold) {
      // debugger;
      console.warn("PREDICTION ERROR!", dist);

      // console.log(controller.historian.timestamps.map((t) => t));
      // console.log(controller.historian.history.map(([, h]) => [...h.position]));

      console.log(serverPosition, pastState.position);

      // reset to auth position
      // body.setNextKinematicTranslation(new Vector3().fromArray(serverPosition));
      body.setTranslation(new Vector3().fromArray(serverPosition), true);
      body.setLinvel(new Vector3().fromArray(serverVelocity), true);

      for (let i = 0; i < controller.outbound.history.length; i++) {
        // roll forward using input history
        const [actionStates] = controller.outbound.history[i];
        updateKinematicControls(ctx, physics, actionStates, node, body);

        // updateKinematicControlsCsp(
        //   ctx,
        //   physics,
        //   actionStates,
        //   node,
        //   body,
        //   pastState,
        //   // 1
        //   Math.max(1, controller.historian.history.length - 1)
        // );
      }
    }
  }
}

export function UpdateClientPosition(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  const haveConnectedPeers = network.peers.length > 0;
  const authNet = network.authoritative;
  const hosting = authNet && isHost(network);
  const cspEnabled = network.clientSidePrediction;

  if (!haveConnectedPeers) return;
  if (!authNet) return;
  if (!cspEnabled) return;
  if (hosting) return;

  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);

  const eid = cspQuery(ctx.world)[0];
  if (!eid) return;

  // TODO: enter cspQuery
  let characterController = physics.eidTocharacterController.get(eid);
  if (!characterController) {
    characterController = physics.physicsWorld.createCharacterController(0.1);
    characterController.enableAutostep(0.2, 0.2, true);
    characterController.enableSnapToGround(0.3);
    characterController.setApplyImpulsesToDynamicBodies(true);
    physics.eidTocharacterController.set(eid, characterController);
  }

  const node = tryGetRemoteResource<RemoteNode>(ctx, eid);

  const body = RigidBody.store.get(eid);
  if (!body) {
    console.warn("rigidbody not found on eid " + eid);
    return;
  }

  const controller = tryGetInputController(input, eid);

  // _q.fromArray(node.quaternion);
  // body.setNextKinematicRotation(_q);

  updateKinematicControls(ctx, physics, controller.actionStates, node, body);

  const msg = createClientPositionMessage(ctx, eid);
  sendReliable(ctx, network, network.hostId, msg);
}

export function SendClientPosition(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);

  const haveConnectedPeers = network.peers.length > 0;
  const authNet = network.authoritative;
  const hosting = authNet && isHost(network);
  const cspEnabled = network.clientSidePrediction;

  if (!haveConnectedPeers) return;
  if (!authNet) return;
  if (!cspEnabled) return;
  if (hosting) return;

  const eid = cspQuery(ctx.world)[0];
  if (!eid) return;

  const msg = createClientPositionMessage(ctx, eid);
  sendReliable(ctx, network, network.hostId, msg);
}
