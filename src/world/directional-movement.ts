import { Vector2 } from "three";
import { getObject3D, Object3DComponent } from "./three";
import { World } from "./World";
import { defineComponent, defineQuery, TypedArray, Types } from "bitecs";

export const DirectionalMovementActions = {
  Move: "DirectionalMovement/Move",
};

export const DirectionalMovementComponent = defineComponent({
  speed: Types.f32,
});

const directionalMovementQuery = defineQuery([
  DirectionalMovementComponent,
  Object3DComponent,
]);

export function DirectionalMovementSystem(world: World) {
  const moveVec = world.actions.get(DirectionalMovementActions.Move) as Vector2;
  const entities = directionalMovementQuery(world);

  entities.forEach((eid) => {
    const speed =
      (DirectionalMovementComponent.speed as TypedArray)[eid] || 0.2;
    const obj = getObject3D(world, eid);
    obj.translateZ(-moveVec.y * speed);
    obj.translateX(moveVec.x * speed);
  });

  return world;
}
