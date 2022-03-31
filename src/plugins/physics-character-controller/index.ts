// import { GameState } from "../GameWorker";
// import { vec2, vec3, quat } from "gl-matrix";
// import { defineQuery, defineComponent } from "bitecs";
// import * as Rapier from "@dimforge/rapier3d-compat";

// export const PhysicsCharacterControllerGroup = 0x0000_0001;
// export const CharacterPhysicsGroup = 0b1;
// export const CharacterInteractionGroup = createInteractionGroup(
//   CharacterPhysicsGroup,
//   PhysicsGroups.All
// );
// export const CharacterShapecastInteractionGroup = createInteractionGroup(
//   PhysicsGroups.All,
//   ~CharacterPhysicsGroup
// );

// function physicsCharacterControllerAction(key: string) {
//   return "PhysicsCharacterController/" + key;
// }

// export const PhysicsCharacterControllerActions = {
//   Move: physicsCharacterControllerAction("Move"),
//   Jump: physicsCharacterControllerAction("Jump"),
//   Sprint: physicsCharacterControllerAction("Sprint"),
//   Crouch: physicsCharacterControllerAction("Crouch"),
// };

// interface PhysicsCharacterControllerState {
//   walkSpeed: number;
//   drag: number;
//   maxWalkSpeed: number;
//   jumpForce: number;
//   inAirModifier: number;
//   inAirDrag: number;
//   crouchModifier: number;
//   crouchJumpModifier: number;
//   minSlideSpeed: number;
//   slideModifier: number;
//   slideDrag: number;
//   slideCooldown: number;
//   sprintModifier: number;
//   maxSprintSpeed: number;
//   moveForce: vec3;
//   dragForce: vec3;
//   linearVelocity: vec3;
//   shapeCastPosition: vec3;
//   shapeCastRotation: quat;
//   isSliding: boolean;
//   slideForce: vec3;
//   lastSlideTime: number;
// }

// export function addPhysicsCharacterControllerComponent(
//   world: World,
//   eid: number,
//   props: Partial<PhysicsCharacterControllerProps> = {}
// ) {
//   addMapComponent(
//     world,
//     PhysicsCharacterControllerComponent,
//     eid,
//     Object.assign(
//       {
//         walkSpeed: 2000,
//         drag: 250,
//         maxWalkSpeed: 20,
//         jumpForce: 750,
//         inAirModifier: 0.5,
//         inAirDrag: 100,
//         crouchModifier: 0.7,
//         crouchJumpModifier: 1.5,
//         minSlideSpeed: 3,
//         slideModifier: 50,
//         slideDrag: 150,
//         slideCooldown: 1,
//         sprintModifier: 1.8,
//         maxSprintSpeed: 25,
//       },
//       props
//     )
//   );
// }

// export function addPhysicsCharacterControllerEntity(
//   world: World,
//   parent?: number,
// ) {
//   const playerRig = new Object3DEntity(world);

//   if (parent !== undefined) {
//     setParentEntity(playerRig.eid, parent);
//   }

//   addPhysicsCharacterControllerComponent(world, playerRig.eid);
//   addRigidBodyComponent(world, playerRig.eid, {
//     bodyType: RigidBodyType.Dynamic,
//     shape: PhysicsColliderShape.Capsule,
//     halfHeight: 0.8,
//     radius: 0.5,
//     translation: new Vector3(0, 0.8, 0),
//     collisionGroups: CharacterInteractionGroup,
//     solverGroups: CharacterInteractionGroup,
//     lockRotations: true,
//   });
//   return playerRig;
// }

// const physicsCharacterControllerQuery = defineQuery([
//   PhysicsCharacterControllerComponent,
//   InternalRigidBodyComponent,
//   Object3DComponent,
// ]);

// const physicsCharacterControllerAddedQuery = enterQuery(
//   physicsCharacterControllerQuery
// );

// export function PhysicsCharacterControllerSystem({
//   world,
//   physicsWorld,
//   time: { dt, elapsed },
// }: GameState) {
//     const characterController = getCharacterController(world);

//     const internalPhysicsWorldComponent =
//       InternalPhysicsWorldComponent.store.get(physicsWorldEid);

//     if (!internalPhysicsWorldComponent) {
//       return world;
//     }

//     // Handle Input
//     const moveVec = world.actions.get(
//       PhysicsCharacterControllerActions.Move
//     ) as Vector2;

//     const jump = world.actions.get(
//       PhysicsCharacterControllerActions.Jump
//     ) as ButtonActionState;

//     const crouch = world.actions.get(
//       PhysicsCharacterControllerActions.Crouch
//     ) as ButtonActionState;

//     const sprint = world.actions.get(
//       PhysicsCharacterControllerActions.Sprint
//     ) as ButtonActionState;

//     entities.forEach((eid) => {
//       const {
//         walkSpeed,
//         drag,
//         inAirModifier,
//         inAirDrag,
//         crouchModifier,
//         maxWalkSpeed,
//         jumpForce,
//         crouchJumpModifier,
//         slideModifier,
//         slideDrag,
//         slideCooldown,
//         minSlideSpeed,
//         sprintModifier,
//         maxSprintSpeed,
//       } = PhysicsCharacterControllerComponent.store.get(eid)!;
//       const internalPhysicsCharacterController =
//         InternalPhysicsCharacterControllerComponent.store.get(eid)!;
//       const {
//         moveForce,
//         dragForce,
//         linearVelocity,
//         shapeCastPosition,
//         shapeCastRotation,
//         isSliding,
//         slideForce,
//         lastSlideTime,
//       } = internalPhysicsCharacterController;
//       const obj = Object3DComponent.store.get(eid)!;
//       const {
//         translation: shapeTranslationOffset,
//         rotation: shapeRotationOffset,
//       } = RigidBodyComponent.store.get(eid)!;
//       const { body, colliderShape } =
//         InternalRigidBodyComponent.store.get(eid)!;

//       body.setRotation(obj.quaternion, true);

//       linearVelocity.copy(body.linvel() as Vector3);

//       shapeCastPosition.copy(obj.position).add(shapeTranslationOffset);
//       shapeCastRotation.copy(obj.quaternion).multiply(shapeRotationOffset);

//       const shapeCastResult = physicsWorld.castShape(
//         shapeCastPosition,
//         shapeCastRotation,
//         physicsWorld.gravity,
//         colliderShape,
//         dt,
//         CharacterShapecastInteractionGroup
//       );

//       const isGrounded = !!shapeCastResult;
//       const isSprinting = isGrounded && sprint.held && !isSliding;

//       const speed = linearVelocity.length();
//       const maxSpeed = isSprinting ? maxSprintSpeed : maxWalkSpeed;

//       if (speed < maxSpeed) {
//         moveForce
//           .set(moveVec.x, 0, -moveVec.y)
//           .normalize()
//           .applyQuaternion(obj.quaternion)
//           .multiplyScalar(walkSpeed * dt);

//         if (!isGrounded) {
//           moveForce.multiplyScalar(inAirModifier);
//         } else if (isGrounded && crouch.held && !isSliding) {
//           moveForce.multiplyScalar(crouchModifier);
//         } else if (isGrounded && sprint.held && !isSliding) {
//           moveForce.multiplyScalar(sprintModifier);
//         }
//       }

//       // TODO: Check to see if velocity matches orientation before sliding
//       if (
//         crouch.pressed &&
//         speed > minSlideSpeed &&
//         isGrounded &&
//         !isSliding &&
//         elapsed > lastSlideTime + slideCooldown
//       ) {
//         slideForce
//           .set(0, 0, (speed + 1) * -slideModifier)
//           .applyQuaternion(obj.quaternion);
//         moveForce.add(slideForce);
//         internalPhysicsCharacterController.isSliding = true;
//         internalPhysicsCharacterController.lastSlideTime = elapsed;
//       } else if (
//         crouch.released ||
//         elapsed > lastSlideTime + slideCooldown
//       ) {
//         internalPhysicsCharacterController.isSliding = false;
//       }

//       if (speed !== 0) {
//         let dragMultiplier = drag;

//         if (isSliding) {
//           dragMultiplier = slideDrag;
//         } else if (!isGrounded) {
//           dragMultiplier = inAirDrag;
//         }

//         dragForce
//           .copy(linearVelocity)
//           .negate()
//           .multiplyScalar(dragMultiplier * dt);

//         moveForce.add(dragForce);
//       }

//       if (jump.pressed && isGrounded) {
//         const jumpModifier = crouch.held ? crouchJumpModifier : 1;
//         moveForce.y += jumpForce * jumpModifier;
//       }

//       moveForce.divideScalar(100)

//       body.applyImpulse(moveForce, true);
//       body.applyForce(physicsWorld.gravity as Vector3, true)
//     });

//     return world;
//   }

