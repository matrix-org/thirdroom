import {
  addComponent,
  defineComponent,
  defineQuery,
  enterQuery,
  exitQuery,
  hasComponent,
} from "bitecs";
import {
  Intersection,
  Object3D,
  Raycaster,
  Vector3,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  DoubleSide,
} from "three";
import { ButtonActionState } from "./input";
import { addPhysicsRaycasterComponent } from "./physics";
import { getObject3D, Object3DComponent, setObject3D } from "./three";
import { World } from "./World";

export const LinkNavigateAction = "Link/Navigate";

export const LinkRaycaster = defineComponent({});
export const LinkComponent = defineComponent({});

export function addLinkComponent(world: World, eid: number, roomId: string) {
  addComponent(world, LinkComponent, eid);
  world.entityToLinkUrl.set(eid, roomId);
  // addRigidBodyComponent(world, eid);
}

export function addLinkRaycaster(world: World, eid: number) {
  addComponent(world, LinkRaycaster, eid);
  addPhysicsRaycasterComponent(world, eid, {
    withIntersection: true,
  });
}

const linkRaycasterQuery = defineQuery([LinkRaycaster, Object3DComponent]);

const linkQuery = defineQuery([LinkComponent, Object3DComponent]);

const newLinksQuery = enterQuery(linkQuery);
const removedLinksQuery = exitQuery(linkQuery);

export function LinkModule(
  world: World,
  { onChangeRoom }: { onChangeRoom: (roomId: string) => void }
) {
  world.entityToLinkUrl = new Map();

  const origin = new Vector3();
  const direction = new Vector3();
  const targetEids: number[] = [];
  const targets: Object3D[] = [];
  const raycaster = new Raycaster(origin, direction);
  const results: Intersection[] = [];

  function LinkSystem(world: World) {
    const linkRaycasters = linkRaycasterQuery(world);
    const newLinks = newLinksQuery(world);
    const removedLinks = newLinksQuery(world);
    const navigate = world.actions.get(LinkNavigateAction) as ButtonActionState;

    newLinks.forEach((eid) => {
      const obj = getObject3D(world, eid);

      const plane = new Mesh(
        new PlaneGeometry(),
        new MeshBasicMaterial({ side: DoubleSide })
      );

      plane.position.copy(obj.position);
      plane.quaternion.copy(obj.quaternion);
      plane.scale.copy(obj.scale);
      setObject3D(world, eid, plane);

      if (targets.indexOf(plane) === -1) {
        targetEids.push(eid);
        targets.push(plane);
      }
    });

    removedLinks.forEach((eid) => {
      const index = targetEids.indexOf(eid);

      if (index !== -1) {
        targetEids.splice(index, 1);
        targets.splice(index, 1);
      }
    });

    if (navigate && navigate.pressed) {
      linkRaycasters.forEach((eid) => {
        const obj = getObject3D(world, eid);
        obj.getWorldPosition(origin);
        obj.getWorldDirection(direction);
        raycaster.intersectObjects(targets, false, results);

        if (results.length > 0) {
          const eid = world.object3DToEntity.get(results[0].object);

          if (eid !== undefined) {
            const url = world.entityToLinkUrl.get(eid);

            if (url) {
              onChangeRoom(url);
            }
          }
        }
      });
    }

    return world;
  }

  return {
    LinkSystem,
  };
}
