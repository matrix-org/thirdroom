import { addComponent, defineComponent, Types, defineQuery } from "bitecs";
import { Vector2, Vector3, Quaternion } from "three";
import { ButtonActionState } from "./input";
import {
  addRigidBodyComponent,
  RigidBodyComponent,
  createInteractionGroup,
  PhysicsGroups,
  RigidBodyType,
  PhysicsColliderShape,
} from "./physics";
import { World } from "./World";
import { getObject3D, Object3DComponent } from "./three";

export const PhysicsCharacterControllerGroup = 0x0000_0001;
export const CharacterPhysicsGroup = 0b1;
export const CharacterInteractionGroup = createInteractionGroup(
  CharacterPhysicsGroup,
  PhysicsGroups.All
);
export const CharacterShapecastInteractionGroup = createInteractionGroup(
  PhysicsGroups.All,
  ~CharacterPhysicsGroup
);

function physicsCharacterControllerAction(key: string) {
  return "PhysicsCharacterController/" + key;
}

export const PhysicsCharacterControllerActions = {
  Move: physicsCharacterControllerAction("Move"),
  Jump: physicsCharacterControllerAction("Jump"),
  Sprint: physicsCharacterControllerAction("Sprint"),
  Crouch: physicsCharacterControllerAction("Crouch"),
};

interface PhysicsCharacterControllerProps {
  walkSpeed?: number;
  drag?: number;
  maxWalkSpeed?: number;
  jumpForce?: number;
  inAirModifier?: number;
  inAirDrag?: number;
  crouchModifier?: number;
  crouchJumpModifier?: number;
  minSlideSpeed?: number;
  slideModifier?: number;
  slideDrag?: number;
  slideCooldown?: number;
  sprintModifier?: number;
  maxSprintSpeed?: number;
}

export const PhysicsCharacterControllerComponent = defineComponent({
  walkSpeed: Types.f32,
  drag: Types.f32,
  maxWalkSpeed: Types.f32,
  jumpForce: Types.f32,
  inAirModifier: Types.f32,
  inAirDrag: Types.f32,
  crouchModifier: Types.f32,
  crouchJumpModifier: Types.f32,
  minSlideSpeed: Types.f32,
  slideModifier: Types.f32,
  slideDrag: Types.f32,
  slideCooldown: Types.f32,
  sprintModifier: Types.f32,
  maxSprintSpeed: Types.f32,
  isSliding: Types.ui8,
  lastSlideTime: Types.ui32,
});

export function addPhysicsCharacterControllerComponent(
  world: World,
  eid: number,
  props: PhysicsCharacterControllerProps = {}
) {
  addComponent(world, PhysicsCharacterControllerComponent, eid);
  PhysicsCharacterControllerComponent.walkSpeed[eid] =
    props.walkSpeed === undefined ? 2000 : props.walkSpeed;
  PhysicsCharacterControllerComponent.drag[eid] =
    props.drag === undefined ? 250 : props.drag;
  PhysicsCharacterControllerComponent.maxWalkSpeed[eid] =
    props.maxWalkSpeed === undefined ? 20 : props.maxWalkSpeed;
  PhysicsCharacterControllerComponent.jumpForce[eid] =
    props.jumpForce === undefined ? 750 : props.jumpForce;
  PhysicsCharacterControllerComponent.inAirModifier[eid] =
    props.inAirModifier === undefined ? 0.5 : props.inAirModifier;
  PhysicsCharacterControllerComponent.inAirDrag[eid] =
    props.inAirDrag === undefined ? 100 : props.inAirDrag;
  PhysicsCharacterControllerComponent.crouchModifier[eid] =
    props.crouchModifier === undefined ? 0.7 : props.crouchModifier;
  PhysicsCharacterControllerComponent.crouchJumpModifier[eid] =
    props.crouchJumpModifier === undefined ? 1.5 : props.crouchJumpModifier;
  PhysicsCharacterControllerComponent.minSlideSpeed[eid] =
    props.minSlideSpeed === undefined ? 3 : props.minSlideSpeed;
  PhysicsCharacterControllerComponent.slideModifier[eid] =
    props.slideModifier === undefined ? 50 : props.slideModifier;
  PhysicsCharacterControllerComponent.slideDrag[eid] =
    props.slideDrag === undefined ? 150 : props.slideDrag;
  PhysicsCharacterControllerComponent.slideCooldown[eid] =
    props.slideCooldown === undefined ? 1 : props.slideCooldown;
  PhysicsCharacterControllerComponent.sprintModifier[eid] =
    props.sprintModifier === undefined ? 1.8 : props.sprintModifier;
  PhysicsCharacterControllerComponent.maxSprintSpeed[eid] =
    props.maxSprintSpeed === undefined ? 25 : props.maxSprintSpeed;
}

export function addPhysicsCharacterController(world: World, eid: number) {
  addPhysicsCharacterControllerComponent(world, eid);
  addRigidBodyComponent(world, eid, {
    bodyType: RigidBodyType.Dynamic,
    shape: PhysicsColliderShape.Capsule,
    halfHeight: 0.8,
    radius: 0.5,
    translation: [0, 0.8, 0],
    collisionGroups: CharacterInteractionGroup,
    solverGroups: CharacterInteractionGroup,
    lockRotations: true,
  });
}

const physicsCharacterControllerQuery = defineQuery([
  PhysicsCharacterControllerComponent,
  RigidBodyComponent,
  Object3DComponent,
]);

const tempVec3 = new Vector3();
const tempQuat = new Quaternion();
const shapeCastPosition = new Vector3();
const shapeCastRotation = new Quaternion();
const moveForce = new Vector3();
const slideForce = new Vector3();
const dragForce = new Vector3();

export function PhysicsCharacterControllerSystem(world: World) {
  const entities = physicsCharacterControllerQuery(world);

  const physicsWorld = world.physicsWorld;

  // Handle Input
  const moveVec = world.actions.get(
    PhysicsCharacterControllerActions.Move
  ) as Vector2;

  const jump = world.actions.get(
    PhysicsCharacterControllerActions.Jump
  ) as ButtonActionState;

  const crouch = world.actions.get(
    PhysicsCharacterControllerActions.Crouch
  ) as ButtonActionState;

  const sprint = world.actions.get(
    PhysicsCharacterControllerActions.Sprint
  ) as ButtonActionState;

  entities.forEach((eid) => {
    const obj = getObject3D(world, eid);
    const shapeTranslationOffset = RigidBodyComponent.translation[eid];
    const shapeRotationOffset = RigidBodyComponent.rotation[eid];

    const rigidBody = world.entityToRigidBody.get(eid);
    const shape = world.entityToShape.get(eid);

    if (!rigidBody || !shape) {
      return;
    }

    rigidBody.setRotation(obj.quaternion, true);

    const linearVelocity = rigidBody.linvel();

    shapeCastPosition
      .copy(obj.position)
      .add(tempVec3.fromArray(shapeTranslationOffset));
    shapeCastRotation
      .copy(obj.quaternion)
      .multiply(tempQuat.fromArray(shapeRotationOffset));

    const shapeCastResult = physicsWorld.castShape(
      shapeCastPosition,
      shapeCastRotation,
      physicsWorld.gravity,
      shape,
      world.delta,
      CharacterShapecastInteractionGroup
    );

    const isSliding = PhysicsCharacterControllerComponent.isSliding[eid];
    const isGrounded = !!shapeCastResult;
    const isSprinting = isGrounded && sprint.held && !isSliding;

    const speed = tempVec3.copy(linearVelocity as Vector3).length();
    const maxSpeed = isSprinting
      ? PhysicsCharacterControllerComponent.maxSprintSpeed[eid]
      : PhysicsCharacterControllerComponent.maxWalkSpeed[eid];

    if (speed < maxSpeed) {
      const walkSpeed = PhysicsCharacterControllerComponent.walkSpeed[eid];

      moveForce
        .set(moveVec.x, 0, -moveVec.y)
        .normalize()
        .applyQuaternion(obj.quaternion)
        .multiplyScalar(walkSpeed * world.delta);

      if (!isGrounded) {
        const inAirModifier =
          PhysicsCharacterControllerComponent.inAirModifier[eid];
        moveForce.multiplyScalar(inAirModifier);
      } else if (isGrounded && crouch.held && !isSliding) {
        const crouchModifier =
          PhysicsCharacterControllerComponent.crouchModifier[eid];
        moveForce.multiplyScalar(crouchModifier);
      } else if (isGrounded && sprint.held && !isSliding) {
        const sprintModifier =
          PhysicsCharacterControllerComponent.sprintModifier[eid];
        moveForce.multiplyScalar(sprintModifier);
      }
    }

    moveForce.add(physicsWorld.gravity as Vector3);

    const minSlideSpeed =
      PhysicsCharacterControllerComponent.minSlideSpeed[eid];
    const lastSlideTime =
      PhysicsCharacterControllerComponent.lastSlideTime[eid];
    const slideCooldown =
      PhysicsCharacterControllerComponent.slideCooldown[eid];

    // TODO: Check to see if velocity matches orientation before sliding
    if (
      crouch.pressed &&
      speed > minSlideSpeed &&
      isGrounded &&
      !isSliding &&
      world.elapsed > lastSlideTime + slideCooldown
    ) {
      const slideModifier =
        PhysicsCharacterControllerComponent.slideModifier[eid];

      slideForce
        .set(0, 0, (speed + 1) * -slideModifier)
        .applyQuaternion(obj.quaternion);
      moveForce.add(slideForce);
      PhysicsCharacterControllerComponent.isSliding[eid] = 1;
      PhysicsCharacterControllerComponent.lastSlideTime[eid] = world.elapsed;
    } else if (
      crouch.released ||
      world.elapsed > lastSlideTime + slideCooldown
    ) {
      PhysicsCharacterControllerComponent.isSliding[eid] = 0;
    }

    if (speed !== 0) {
      let dragMultiplier = PhysicsCharacterControllerComponent.drag[eid];

      if (isSliding) {
        dragMultiplier = PhysicsCharacterControllerComponent.slideDrag[eid];
      } else if (!isGrounded) {
        dragMultiplier = PhysicsCharacterControllerComponent.inAirDrag[eid];
      }

      dragForce
        .copy(linearVelocity as Vector3)
        .negate()
        .multiplyScalar(dragMultiplier * world.delta);
      moveForce.add(dragForce);
    }

    if (jump.pressed && isGrounded) {
      const jumpModifier = crouch.held
        ? PhysicsCharacterControllerComponent.crouchJumpModifier[eid]
        : 1;
      moveForce.y +=
        PhysicsCharacterControllerComponent.jumpForce[eid] * jumpModifier;
    }

    rigidBody.applyForce(moveForce, true);
  });

  return world;
}
