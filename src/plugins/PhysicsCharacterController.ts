import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, addEntity, defineComponent, defineQuery } from "bitecs";
import { Object3D, Quaternion, Vector3 } from "three";

import { Player } from "../engine/component/Player";
import { addChild, addTransformComponent, Transform } from "../engine/component/transform";
import { GameState } from "../engine/GameTypes";
import {
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
  enableActionMap,
} from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { createRemoteStandardMaterial } from "../engine/material/material.game";
import { defineModule, getModule } from "../engine/module/module.common";
import { Networked, NetworkTransform, Owned } from "../engine/network/network.game";
import { NetworkModule } from "../engine/network/network.game";
import { addRigidBody, PhysicsModule, RigidBody } from "../engine/physics/physics.game";
import { addCubeMesh, createCamera } from "../engine/prefab";
import { addCameraPitchTargetComponent, addCameraYawTargetComponent } from "./FirstPersonCamera";

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
  actions: [
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

export const PhysicsCharacterControllerModule = defineModule<GameState, PhysicsCharacterControllerModuleState>({
  name: "physics-character-controller",
  create() {
    return {};
  },
  init(state) {
    enableActionMap(state, PhysicsCharacterControllerActionMap);
  },
});

export enum PhysicsGroups {
  None = 0,
  All = 0xffff,
}

export enum PhysicsInteractionGroups {
  None = 0,
  Default = 0xffff_ffff,
}

export function createInteractionGroup(groups: number, mask: number) {
  return (groups << 16) | mask;
}

export const CharacterPhysicsGroup = 0b1;
export const CharacterInteractionGroup = createInteractionGroup(CharacterPhysicsGroup, PhysicsGroups.All);
export const CharacterShapecastInteractionGroup = createInteractionGroup(PhysicsGroups.All, ~CharacterPhysicsGroup);

const obj = new Object3D();

const walkSpeed = 50;
const drag = 10;
const maxWalkSpeed = 100;
const jumpForce = 10;
const inAirModifier = 0.5;
const inAirDrag = 8;
const crouchModifier = 0.7;
const crouchJumpModifier = 1.5;
const minSlideSpeed = 3;
const slideModifier = 50;
const slideDrag = 150;
const slideCooldown = 1;
const sprintModifier = 1.8;
const maxSprintSpeed = 25;

const moveForce = new Vector3();
const dragForce = new Vector3();
const linearVelocity = new Vector3();
const shapeCastPosition = new Vector3();
const shapeCastRotation = new Quaternion();
let isSliding = false;
const slideForce = new Vector3();
let lastSlideTime = 0;

const colliderShape = new RAPIER.Capsule(0.5, 0.5);

const shapeTranslationOffset = new Vector3(0, 0, 0);
const shapeRotationOffset = new Quaternion(0, 0, 0, 0);

export const PlayerRig = defineComponent();
export const playerRigQuery = defineQuery([PlayerRig]);

export const createRawCube = (state: GameState) => {
  const { world } = state;
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  addCubeMesh(
    state,
    eid,
    1,
    createRemoteStandardMaterial(state, {
      baseColorFactor: [1, 1, 1, 1.0],
      roughnessFactor: 0.1,
      metallicFactor: 0.9,
    })
  );

  return eid;
};

export const createPlayerRig = (state: GameState, setActiveCamera = true) => {
  const { world } = state;
  const { physicsWorld } = getModule(state, PhysicsModule);
  const network = getModule(state, NetworkModule);

  const playerRig = addEntity(world);
  addTransformComponent(world, playerRig);

  // how this player looks to others
  state.entityPrefabMap.set(playerRig, Math.random() > 0.5 ? "mixamo-x" : "mixamo-y");

  network.peerIdToEntityId.set(network.peerId, playerRig);

  addComponent(world, PlayerRig, playerRig);
  Transform.position[playerRig][2] = 50;

  addCameraYawTargetComponent(world, playerRig);

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.5);
  colliderDesc.setCollisionGroups(CharacterInteractionGroup);
  colliderDesc.setSolverGroups(CharacterInteractionGroup);
  // colliderDesc.setTranslation(0, -1, 0);

  physicsWorld.createCollider(colliderDesc, rigidBody.handle);
  addRigidBody(world, playerRig, rigidBody);

  const camera = createCamera(state, setActiveCamera);
  addCameraPitchTargetComponent(world, camera);
  addChild(playerRig, camera);
  const cameraPosition = Transform.position[camera];
  cameraPosition[1] = 1.2;

  // caveat: if owned added after player, this local player entity is added to enteredRemotePlayerQuery
  addComponent(world, Owned, playerRig);
  addComponent(world, Player, playerRig);
  addComponent(world, Networked, playerRig);
  addComponent(world, NetworkTransform, playerRig);

  return playerRig;
};

export const PlayerControllerSystem = (state: GameState) => {
  const { physicsWorld } = getModule(state, PhysicsModule);
  const input = getModule(state, InputModule);
  const playerRig = playerRigQuery(state.world)[0];

  if (!playerRig) {
    return;
  }

  const body = RigidBody.store.get(playerRig);
  if (body) {
    obj.quaternion.x = Transform.quaternion[playerRig][0];
    obj.quaternion.y = Transform.quaternion[playerRig][1];
    obj.quaternion.z = Transform.quaternion[playerRig][2];
    obj.quaternion.w = Transform.quaternion[playerRig][3];
    body.setRotation(obj.quaternion, true);

    // Handle Input
    const moveVec = input.actions.get(PhysicsCharacterControllerActions.Move) as Float32Array;
    const jump = input.actions.get(PhysicsCharacterControllerActions.Jump) as ButtonActionState;
    const crouch = input.actions.get(PhysicsCharacterControllerActions.Crouch) as ButtonActionState;
    const sprint = input.actions.get(PhysicsCharacterControllerActions.Sprint) as ButtonActionState;

    linearVelocity.copy(body.linvel() as Vector3);

    shapeCastPosition.copy(body.translation() as Vector3).add(shapeTranslationOffset);
    shapeCastRotation.copy(obj.quaternion).multiply(shapeRotationOffset);

    // todo: tune interaction groups
    const shapeCastResult = physicsWorld.castShape(
      shapeCastPosition,
      shapeCastRotation,
      physicsWorld.gravity,
      colliderShape,
      state.dt,
      CharacterShapecastInteractionGroup
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
        .multiplyScalar(walkSpeed * state.dt);

      if (!isGrounded) {
        moveForce.multiplyScalar(inAirModifier);
      } else if (isGrounded && crouch.held && !isSliding) {
        moveForce.multiplyScalar(crouchModifier);
      } else if (isGrounded && sprint.held && !isSliding) {
        moveForce.multiplyScalar(sprintModifier);
      }
    }

    // TODO: Check to see if velocity matches orientation before sliding
    if (
      crouch.pressed &&
      speed > minSlideSpeed &&
      isGrounded &&
      !isSliding &&
      state.dt > lastSlideTime + slideCooldown
    ) {
      slideForce.set(0, 0, (speed + 1) * -slideModifier).applyQuaternion(obj.quaternion);
      moveForce.add(slideForce);
      isSliding = true;
      lastSlideTime = state.elapsed;
    } else if (crouch.released || state.dt > lastSlideTime + slideCooldown) {
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
        .multiplyScalar(dragMultiplier * state.dt);

      dragForce.y = 0;

      moveForce.add(dragForce);
    }

    if (jump.pressed && isGrounded) {
      const jumpModifier = crouch.held ? crouchJumpModifier : 1;
      moveForce.y += jumpForce * jumpModifier;
    }

    body.applyImpulse(moveForce, true);
    body.applyForce(physicsWorld.gravity as Vector3, true);
  }
};
