import * as Rapier from "@dimforge/rapier3d-compat";
import {
  Vector3,
  Mesh,
  Quaternion,
  ArrowHelper,
  InterleavedBufferAttribute,
} from "three";
import {
  defineQuery,
  enterQuery,
  Types,
  defineComponent,
  addComponent,
  TypedArray,
} from "bitecs";
import { World } from "./World";
import { Object3DComponent, getObject3D } from "./three";
import { vec3 } from "gl-matrix";

function vectorToArray(out: number[] | TypedArray, vector: Rapier.Vector) {
  out[0] = vector.x;
  out[1] = vector.y;
  out[2] = vector.z;
  return out;
}

export enum PhysicsColliderShape {
  Auto, // Requires Mesh Geometry
  Capsule,
}

export const RigidBodyType = Rapier.RigidBodyType;

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

interface RigidBodyProps {
  shape?: PhysicsColliderShape;
  translation?: number[];
  rotation?: number[];
  bodyType?: Rapier.RigidBodyType;
  solverGroups?: number;
  collisionGroups?: number;
  lockRotations?: boolean;
  friction?: number;
  halfHeight?: number;
  radius?: number;
}

export const RigidBodyComponent = defineComponent({
  bodyType: Types.ui8,
  shape: Types.ui8,
  translation: [Types.f32, 3],
  rotation: [Types.f32, 4],
  solverGroups: Types.ui32,
  collisionGroups: Types.ui32,
  lockRotations: Types.ui8,
  friction: Types.f32,
});

export const CapsuleRigidBodyComponent = defineComponent({
  halfHeight: Types.f32,
  radius: Types.f32,
});

export function addRigidBodyComponent(
  world: World,
  eid: number,
  props: RigidBodyProps = {}
) {
  addComponent(world, RigidBodyComponent, eid);

  RigidBodyComponent.bodyType[eid] =
    props.bodyType === undefined ? Rapier.RigidBodyType.Static : props.bodyType;
  RigidBodyComponent.shape[eid] =
    props.shape === undefined ? PhysicsColliderShape.Auto : props.shape;
  RigidBodyComponent.translation[eid].set(props.translation || [0, 0, 0]);
  RigidBodyComponent.rotation[eid].set(props.rotation || [0, 0, 0, 1]);
  RigidBodyComponent.solverGroups[eid] =
    props.solverGroups === undefined
      ? PhysicsInteractionGroups.Default
      : props.solverGroups;
  RigidBodyComponent.collisionGroups[eid] =
    props.collisionGroups === undefined
      ? PhysicsInteractionGroups.Default
      : props.collisionGroups;
  RigidBodyComponent.lockRotations[eid] = props.lockRotations ? 1 : 0;
  RigidBodyComponent.friction[eid] =
    props.friction == undefined ? 0.5 : props.friction;

  if (props.shape === PhysicsColliderShape.Capsule) {
    addComponent(world, CapsuleRigidBodyComponent, eid);
    CapsuleRigidBodyComponent.halfHeight[eid] =
      props.halfHeight === undefined ? 0.5 : props.halfHeight;
    CapsuleRigidBodyComponent.radius[eid] =
      props.radius === undefined ? 0.5 : props.radius;
  }
}

export const rigidBodiesQuery = defineQuery([
  RigidBodyComponent,
  Object3DComponent,
]);
export const newRigidBodiesQuery = enterQuery(rigidBodiesQuery);

interface PhysicsRaycasterProps {
  useObject3DTransform?: boolean;
  transformNeedsUpdate?: boolean;
  transformAutoUpdate?: boolean;
  withIntersection?: boolean;
  withNormal?: boolean;
  origin?: number[];
  dir?: number[];
  colliderEid?: number;
  toi?: number;
  maxToi?: number;
  groups?: number;
  debug?: boolean;
}

export const PhysicsRaycasterComponent = defineComponent({
  useObject3DTransform: Types.ui8,
  transformNeedsUpdate: Types.ui8,
  transformAutoUpdate: Types.ui8,
  withIntersection: Types.ui8,
  withNormal: Types.ui8,
  origin: [Types.f32, 3],
  dir: [Types.f32, 3],
  colliderEid: Types.ui32,
  toi: Types.f32,
  intersection: [Types.f32, 3],
  normal: [Types.f32, 3],
  maxToi: Types.f32,
  groups: Types.ui32,
  debug: Types.ui8,
});

export function addPhysicsRaycasterComponent(
  world: World,
  eid: number,
  props: PhysicsRaycasterProps
) {
  addComponent(world, PhysicsRaycasterComponent, eid);
  const useObject3DTransform =
    props.useObject3DTransform === undefined
      ? true
      : props.useObject3DTransform;

  let transformNeedsUpdate = props.transformNeedsUpdate;
  let transformAutoUpdate = props.transformAutoUpdate;

  if (useObject3DTransform && transformAutoUpdate === undefined) {
    transformAutoUpdate = true;
    transformNeedsUpdate = true;
  } else if (transformNeedsUpdate === undefined) {
    transformNeedsUpdate = true;
  }

  if (transformAutoUpdate === undefined) {
    transformAutoUpdate = false;
  }

  PhysicsRaycasterComponent.useObject3DTransform[eid] = useObject3DTransform
    ? 1
    : 0;
  PhysicsRaycasterComponent.transformNeedsUpdate[eid] = transformNeedsUpdate
    ? 1
    : 0;
  PhysicsRaycasterComponent.transformAutoUpdate[eid] = transformAutoUpdate
    ? 1
    : 0;
  PhysicsRaycasterComponent.withIntersection[eid] = props.withIntersection
    ? 1
    : 0;
  PhysicsRaycasterComponent.withNormal[eid] = props.withNormal ? 1 : 0;
  PhysicsRaycasterComponent.origin[eid].set(props.origin || [0, 0, 0]);
  PhysicsRaycasterComponent.dir[eid].set(props.dir || [0, 0, 0]);
  PhysicsRaycasterComponent.intersection[eid].set([0, 0, 0]);
  PhysicsRaycasterComponent.normal[eid].set([0, 0, 0]);
  PhysicsRaycasterComponent.maxToi[eid] =
    props.maxToi === undefined ? 10000 : props.maxToi;
  PhysicsRaycasterComponent.groups[eid] =
    props.groups === undefined
      ? PhysicsInteractionGroups.Default
      : props.groups;
  PhysicsRaycasterComponent.debug[eid] = props.debug ? 1 : 0;
}

export const physicsRaycasterQuery = defineQuery([PhysicsRaycasterComponent]);
export const newPhysicsRaycastersQuery = enterQuery(physicsRaycasterQuery);

export async function PhysicsModule(world: World) {
  await Rapier.init();

  world.physicsWorld = new Rapier.World(new Rapier.Vector3(0, -9.8, 0));
  world.colliderHandleToEntityMap = new Map();
  world.entityToShape = new Map();
  world.entityToCollider = new Map();
  world.entityToRigidBody = new Map();
  world.entityToRay = new Map();
  world.entityToArrowHelper = new Map();

  const tempVec3 = new Vector3();
  const tempQuat = new Quaternion();

  function PhysicsSystem(world: World) {
    const rigidBodyEntities = rigidBodiesQuery(world);
    const newRigidBodyEntities = newRigidBodiesQuery(world);
    const physicsRaycasterEntities = physicsRaycasterQuery(world);
    const newPhysicsRaycasterEntities = newPhysicsRaycastersQuery(world);
    const sceneEid = world.sceneEid;

    newRigidBodyEntities.forEach((rigidBodyEid) => {
      const obj = getObject3D(world, rigidBodyEid)!;

      obj.getWorldPosition(tempVec3);
      obj.getWorldQuaternion(tempQuat);

      const rigidBodyDesc = new Rapier.RigidBodyDesc(
        RigidBodyComponent.bodyType[rigidBodyEid]
      );

      rigidBodyDesc.setRotation(tempQuat.clone());
      rigidBodyDesc.setTranslation(tempVec3.x, tempVec3.y, tempVec3.z);

      if (RigidBodyComponent.lockRotations[rigidBodyEid]) {
        rigidBodyDesc.lockRotations();
      }

      const rigidBody = world.physicsWorld.createRigidBody(rigidBodyDesc);

      let shape: Rapier.Shape;

      const colliderShape = RigidBodyComponent.shape[
        rigidBodyEid
      ] as PhysicsColliderShape;

      if (colliderShape === PhysicsColliderShape.Auto) {
        const geometry = (obj as Mesh).geometry;

        if (!geometry || !geometry.attributes.position) {
          console.warn(`Entity ${rigidBodyEid} has an invalid geometry`);
          return;
        }

        if (geometry.type === "BoxGeometry") {
          geometry.computeBoundingBox();
          const boundingBoxSize = geometry.boundingBox!.getSize(new Vector3());

          shape = new Rapier.Cuboid(
            boundingBoxSize.x / 2,
            boundingBoxSize.y / 2,
            boundingBoxSize.z / 2
          );
        } else if (geometry.type === "SphereGeometry") {
          geometry.computeBoundingSphere();
          const radius = geometry.boundingSphere!.radius;
          shape = new Rapier.Ball(radius);
        } else if (geometry.type === "BufferGeometry") {
          let indices: Uint32Array;
          let positions: Float32Array;

          if (
            (geometry.attributes.position as InterleavedBufferAttribute)
              .isInterleavedBufferAttribute
          ) {
            const attribute = geometry.attributes
              .position as InterleavedBufferAttribute;

            positions = new Float32Array(attribute.count * attribute.itemSize);

            for (let i = 0; i < attribute.count; i++) {
              positions[i * attribute.itemSize] = attribute.getX(i);
              positions[i * attribute.itemSize + 1] = attribute.getY(i);
              positions[i * attribute.itemSize + 2] = attribute.getZ(i);
            }

            if (geometry.index) {
              indices = geometry.index.array as Uint32Array;
            } else {
              const count = attribute.count;

              indices = new Uint32Array(count);
              for (let i = 0; i < count; i++) {
                indices[i] = i;
              }
            }
          } else {
            positions = geometry.attributes.position.array as Float32Array;

            if (geometry.index) {
              indices = geometry.index.array as Uint32Array;
            } else {
              const count = geometry.attributes.position.count;

              indices = new Uint32Array(count);
              for (let i = 0; i < count; i++) {
                indices[i] = i;
              }
            }
          }

          shape = new Rapier.TriMesh(positions, indices);
        } else {
          console.warn(
            `Entity ${rigidBodyEid} has an unsupported three.js geometry ${geometry.type}`
          );
          return;
        }
      } else if (colliderShape === PhysicsColliderShape.Capsule) {
        shape = new Rapier.Capsule(
          CapsuleRigidBodyComponent.halfHeight[rigidBodyEid],
          CapsuleRigidBodyComponent.radius[rigidBodyEid]
        );
      } else {
        console.warn(`Entity ${rigidBodyEid} has an invalid shape`);
        return;
      }

      const colliderDesc = new Rapier.ColliderDesc(shape);

      const translation = RigidBodyComponent.translation[rigidBodyEid];
      colliderDesc.setTranslation(
        translation[0],
        translation[1],
        translation[2]
      );

      const rotation = RigidBodyComponent.rotation[rigidBodyEid];
      colliderDesc.setRotation(
        new Rapier.Quaternion(
          rotation[0],
          rotation[1],
          rotation[2],
          rotation[3]
        )
      );

      colliderDesc.setCollisionGroups(
        RigidBodyComponent.collisionGroups[rigidBodyEid]
      );
      colliderDesc.setSolverGroups(
        RigidBodyComponent.solverGroups[rigidBodyEid]
      );
      colliderDesc.setFriction(RigidBodyComponent.friction[rigidBodyEid]);

      // TODO: Handle mass / density
      // TODO: Handle scale

      const collider = world.physicsWorld.createCollider(
        colliderDesc,
        rigidBody.handle
      );

      world.colliderHandleToEntityMap.set(collider.handle, rigidBodyEid);
      world.entityToShape.set(rigidBodyEid, shape);
      world.entityToCollider.set(rigidBodyEid, collider);
      world.entityToRigidBody.set(rigidBodyEid, rigidBody);
    });

    newPhysicsRaycasterEntities.forEach((raycasterEid) => {
      const origin = PhysicsRaycasterComponent.origin[raycasterEid];
      const dir = PhysicsRaycasterComponent.dir[raycasterEid];
      const ray = new Rapier.Ray(
        new Rapier.Vector3(origin[0], origin[1], origin[2]),
        new Rapier.Vector3(dir[0], dir[1], dir[2])
      );
      world.entityToRay.set(raycasterEid, ray);
    });

    world.physicsWorld.timestep = world.delta;
    world.physicsWorld.step();

    physicsRaycasterEntities.forEach((rayCasterEid) => {
      const obj = getObject3D(world, rayCasterEid);

      if (
        PhysicsRaycasterComponent.useObject3DTransform[rayCasterEid] &&
        obj &&
        (PhysicsRaycasterComponent.transformNeedsUpdate[rayCasterEid] ||
          PhysicsRaycasterComponent.transformAutoUpdate[rayCasterEid])
      ) {
        obj.getWorldPosition(tempVec3);
        const origin = PhysicsRaycasterComponent.origin[rayCasterEid];
        tempVec3.toArray(origin);

        obj.getWorldDirection(tempVec3);
        const dir = PhysicsRaycasterComponent.dir[rayCasterEid];
        tempVec3.toArray(dir);

        if (!PhysicsRaycasterComponent.transformAutoUpdate[rayCasterEid]) {
          PhysicsRaycasterComponent.transformNeedsUpdate[rayCasterEid] = 0;
        }
      }

      const colliderSet = world.physicsWorld.colliders;

      const ray = world.entityToRay.get(rayCasterEid)!;

      const dir = PhysicsRaycasterComponent.dir[rayCasterEid];
      ray.dir.x = dir[0];
      ray.dir.y = dir[1];
      ray.dir.z = dir[2];

      const origin = PhysicsRaycasterComponent.origin[rayCasterEid];
      ray.origin.x = origin[0];
      ray.origin.y = origin[1];
      ray.origin.z = origin[2];

      let intersection;

      if (PhysicsRaycasterComponent.withNormal[rayCasterEid]) {
        intersection = world.physicsWorld.queryPipeline.castRayAndGetNormal(
          colliderSet,
          ray,
          PhysicsRaycasterComponent.maxToi[rayCasterEid],
          true,
          PhysicsRaycasterComponent.groups[rayCasterEid]
        );

        const normal = PhysicsRaycasterComponent.normal[rayCasterEid];

        if (intersection) {
          vectorToArray(normal, intersection.normal);
        } else {
          vec3.zero(normal);
        }
      } else {
        intersection = world.physicsWorld.queryPipeline.castRay(
          colliderSet,
          ray,
          PhysicsRaycasterComponent.maxToi[rayCasterEid],
          true,
          PhysicsRaycasterComponent.groups[rayCasterEid]
        );

        // console.log(
        //   ray.dir,
        //   ray.origin,
        //   PhysicsRaycasterComponent.maxToi[rayCasterEid],
        //   intersection?.colliderHandle,
        //   intersection?.toi,
        //   PhysicsRaycasterComponent.groups[rayCasterEid]
        // );
      }

      if (intersection) {
        PhysicsRaycasterComponent.colliderEid[rayCasterEid] =
          world.colliderHandleToEntityMap.get(intersection.colliderHandle)!;
        PhysicsRaycasterComponent.toi[rayCasterEid] = intersection.toi;
      } else {
        PhysicsRaycasterComponent.colliderEid[rayCasterEid] = 0;
        PhysicsRaycasterComponent.toi[rayCasterEid] = -1;
      }

      if (PhysicsRaycasterComponent.withIntersection[rayCasterEid]) {
        const intersection =
          PhysicsRaycasterComponent.intersection[rayCasterEid];

        if (PhysicsRaycasterComponent.toi[rayCasterEid] !== -1) {
          vec3.add(
            intersection,
            PhysicsRaycasterComponent.origin[rayCasterEid],
            PhysicsRaycasterComponent.dir[rayCasterEid]
          );
          vec3.scale(
            intersection,
            intersection,
            PhysicsRaycasterComponent.toi[rayCasterEid]
          );
        } else {
          vec3.zero(intersection);
        }
      }

      if (sceneEid === undefined) {
        return;
      }

      const debug = PhysicsRaycasterComponent.debug[rayCasterEid];

      let arrowHelper = world.entityToArrowHelper.get(rayCasterEid);

      if (debug) {
        if (!arrowHelper) {
          arrowHelper = new ArrowHelper(
            new Vector3().fromArray(
              PhysicsRaycasterComponent.dir[rayCasterEid]
            ),
            new Vector3().fromArray(
              PhysicsRaycasterComponent.origin[rayCasterEid]
            ),
            PhysicsRaycasterComponent.toi[rayCasterEid],
            0xffff00,
            0.2,
            0.1
          );
          getObject3D(world, sceneEid).add(arrowHelper);
          world.entityToArrowHelper.set(rayCasterEid, arrowHelper);
        } else {
          arrowHelper.position.fromArray(
            PhysicsRaycasterComponent.origin[rayCasterEid]
          );
          tempVec3.fromArray(PhysicsRaycasterComponent.dir[rayCasterEid]);
          arrowHelper.setDirection(tempVec3);
          arrowHelper.setLength(
            PhysicsRaycasterComponent.toi[rayCasterEid] || 0,
            0.2,
            0.1
          );
        }
      } else if (!debug && arrowHelper) {
        const scene = getObject3D(world, sceneEid);
        scene.remove(arrowHelper);
        world.entityToArrowHelper.delete(rayCasterEid);
      }
    });

    rigidBodyEntities.forEach((rigidBodyEid) => {
      const obj = getObject3D(world, rigidBodyEid);
      const lockRotations = RigidBodyComponent.lockRotations[rigidBodyEid];
      const rigidBody = world.entityToRigidBody.get(rigidBodyEid)!;

      if (rigidBody.isDynamic()) {
        const translation = rigidBody.translation();
        const rotation = rigidBody.rotation();
        obj.position.set(translation.x, translation.y, translation.z);

        if (!lockRotations) {
          obj.quaternion.copy(rotation as Quaternion);
        }
      } else if (rigidBody.isKinematic()) {
        rigidBody.setNextKinematicTranslation(obj.position);
        rigidBody.setNextKinematicRotation(obj.quaternion);
      }
    });

    return world;
  }

  return {
    PhysicsSystem,
  };
}
