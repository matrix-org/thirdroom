import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, addEntity, defineComponent, defineQuery } from "bitecs";
import { Object3D, Quaternion, Vector3 } from "three";

import { Player } from "../engine/component/Player";
import { addRenderableComponent } from "../engine/component/renderable";
import { addChild, addTransformComponent, Transform } from "../engine/component/transform";
import { GameState } from "../engine/GameTypes";
import { ButtonActionState } from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { getModule } from "../engine/module/module.common";
import { Networked, NetworkTransform, Owned } from "../engine/network/network.game";
import { NetworkModule } from "../engine/network/network.game";
import { addRigidBody, PhysicsModule, RigidBody } from "../engine/physics/physics.game";
import { createCamera } from "../engine/prefab";
import { RendererModule } from "../engine/renderer/renderer.game";
import { GeometryType } from "../engine/resources/GeometryResourceLoader";
import { MaterialType } from "../engine/resources/MaterialResourceLoader";
import { loadRemoteResource } from "../engine/resources/RemoteResourceManager";
import { addCameraPitchTargetComponent, addCameraYawTargetComponent } from "./FirstPersonCamera";

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

export const PhysicsCharacterControllerGroup = 0x0000_0001;
export const CharacterPhysicsGroup = 0b1;
export const CharacterInteractionGroup = createInteractionGroup(CharacterPhysicsGroup, PhysicsGroups.All);
export const CharacterShapecastInteractionGroup = createInteractionGroup(PhysicsGroups.All, ~CharacterPhysicsGroup);

function physicsCharacterControllerAction(key: string) {
  return "PhysicsCharacterController/" + key;
}

export const PhysicsCharacterControllerActions = {
  Move: physicsCharacterControllerAction("Move"),
  Jump: physicsCharacterControllerAction("Jump"),
  Sprint: physicsCharacterControllerAction("Sprint"),
  Crouch: physicsCharacterControllerAction("Crouch"),
};

const obj = new Object3D();

const walkSpeed = 50;
const drag = 10;
const maxWalkSpeed = 100;
const jumpForce = 10;
const inAirModifier = 0.5;
const inAirDrag = 10;
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

const shapeTranslationOffset = new Vector3(0, 0.8, 0);
const shapeRotationOffset = new Quaternion(0, 0, 0, 0);

export const PlayerRig = defineComponent();
export const playerRigQuery = defineQuery([PlayerRig]);

export const createRawCube = (state: GameState, geometryResourceId?: number) => {
  const { resourceManager } = getModule(state, RendererModule);
  const { world } = state;
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  if (!geometryResourceId) {
    geometryResourceId = loadRemoteResource(resourceManager, {
      type: "geometry",
      geometryType: GeometryType.Box,
    });
  }

  const materialResourceId = loadRemoteResource(resourceManager, {
    type: "material",
    materialType: MaterialType.Physical,
    baseColorFactor: [1, 1, 1, 1.0],
    roughnessFactor: 0.1,
    metallicFactor: 0.9,
  });

  const resourceId = loadRemoteResource(resourceManager, {
    type: "mesh",
    geometryResourceId,
    materialResourceId,
  });

  addRenderableComponent(state, eid, resourceId);

  return eid;
};

export const createPlayerRig = (state: GameState, setActiveCamera = true) => {
  const { world } = state;
  const { physicsWorld } = getModule(state, PhysicsModule);
  const network = getModule(state, NetworkModule);

  const playerRig = addEntity(world);
  addTransformComponent(world, playerRig);

  // how this player looks to others
  state.entityPrefabMap.set(playerRig, "player-cube");

  network.peerIdToEntityId.set(network.peerId, playerRig);

  const lowerCube = createRawCube(state);
  addChild(playerRig, lowerCube);

  addComponent(world, PlayerRig, playerRig);
  Transform.position[playerRig][2] = 50;

  addCameraYawTargetComponent(world, playerRig);

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
  physicsWorld.createCollider(colliderDesc, rigidBody.handle);
  addRigidBody(world, playerRig, rigidBody);

  const camera = createCamera(state, setActiveCamera);
  addCameraPitchTargetComponent(world, camera);
  addChild(playerRig, camera);
  const cameraPosition = Transform.position[camera];
  cameraPosition[1] = 1.6;

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
