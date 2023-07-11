import { vec3, mat4, quat } from "gl-matrix";
import { defineComponent, addComponent, removeComponent, hasComponent } from "bitecs";
import RAPIER, { RigidBody as RapierRigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";

import { GameContext, World } from "../GameTypes";
import { defineModule, getModule } from "../module/module.common";
import { getRemoteResource, tryGetRemoteResource } from "../resource/resource.game";
import {
  RemoteCollider,
  RemoteNode,
  RemotePhysicsBody,
  enteredPhysicsBodyQuery,
  physicsBodyQuery,
} from "../resource/RemoteResources";
import { ColliderType, MeshPrimitiveAttributeIndex, PhysicsBodyType } from "../resource/schema";
import { getAccessorArrayView, scaleVec3Array } from "../common/accessor";
import { updateMatrixWorld } from "../component/transform";
import { Player } from "../player/Player";
import { getRotationNoAlloc } from "../utils/getRotationNoAlloc";
import { dynamicObjectCollisionGroups, staticRigidBodyCollisionGroups } from "./CollisionGroups";
import { updatePhysicsDebugBuffers } from "../renderer/renderer.game";

export type CollisionHandler = (eid1: number, eid2: number, handle1: number, handle2: number, started: boolean) => void;

export interface PhysicsModuleState {
  physicsWorld: RAPIER.World;
  eventQueue: RAPIER.EventQueue;
  handleToEid: Map<number, number>;
  characterCollision: RAPIER.CharacterCollision;
  collisionHandlers: CollisionHandler[];
  eidTocharacterController: Map<number, RAPIER.KinematicCharacterController>;
}

export const PhysicsModule = defineModule<GameContext, PhysicsModuleState>({
  name: "physics",
  async create(_ctx, { waitForMessage }) {
    await RAPIER.init();

    const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
    const physicsWorld = new RAPIER.World(gravity);
    const handleToEid = new Map<number, number>();
    const eventQueue = new RAPIER.EventQueue(true);

    return {
      physicsWorld,
      eventQueue,
      handleToEid,
      collisionHandlers: [],
      characterCollision: new RAPIER.CharacterCollision(),
      eidTocharacterController: new Map<number, RAPIER.KinematicCharacterController>(),
    };
  },
  init(ctx) {},
});

// data flows from transform->body
export const KinematicBody = defineComponent();

// data flows from body->transform
export const RigidBody = defineComponent();

// daata doesn't change
export const StaticBody = defineComponent();

const _v = new Vector3();
const _q = new Quaternion();
const _worldVec3 = vec3.create();
const _worldQuat = quat.create();

export const applyTransformToRigidBody = (body: RapierRigidBody, node: RemoteNode) => {
  body.setTranslation(_v.fromArray(node.position), true);
  body.setRotation(_q.fromArray(node.quaternion), true);
};

const applyRigidBodyToTransform = (body: RapierRigidBody, node: RemoteNode) => {
  if (body.bodyType() === RAPIER.RigidBodyType.Fixed) {
    return;
  }

  const rigidPos = body.translation();
  const rigidRot = body.rotation();
  const position = node.position;
  const quaternion = node.quaternion;

  position[0] = rigidPos.x;
  position[1] = rigidPos.y;
  position[2] = rigidPos.z;

  quaternion[0] = rigidRot.x;
  quaternion[1] = rigidRot.y;
  quaternion[2] = rigidRot.z;
  quaternion[3] = rigidRot.w;
};

export function PhysicsSystem(ctx: GameContext) {
  const { world, dt } = ctx;
  const physics = getModule(ctx, PhysicsModule);
  const { physicsWorld, handleToEid, eventQueue, collisionHandlers } = physics;

  physicsWorld.timestep = dt;
  physicsWorld.step(eventQueue);

  eventQueue.drainCollisionEvents((handle1: number, handle2: number, started: boolean) => {
    const eid1 = handleToEid.get(handle1);
    const eid2 = handleToEid.get(handle2);

    if (eid1 === undefined || eid2 === undefined) {
      return;
    }

    for (const collisionHandler of collisionHandlers) {
      collisionHandler(eid1, eid2, handle1, handle2, started);
    }
  });

  const entered = enteredPhysicsBodyQuery(ctx.world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const body = node.physicsBody?.body;

    if (body && body.bodyType() !== RAPIER.RigidBodyType.Fixed) {
      applyTransformToRigidBody(body, node);
    }
  }

  // apply rigidbody to transform for regular physics entities
  const physicsEntities = physicsBodyQuery(world);
  for (let i = 0; i < physicsEntities.length; i++) {
    const eid = physicsEntities[i];
    const node = getRemoteResource<RemoteNode>(ctx, eid);

    if (!node || !node.physicsBody?.body) {
      continue;
    }

    const body = node.physicsBody.body;
    const bodyType = body.bodyType();

    if (bodyType !== RAPIER.RigidBodyType.Fixed) {
      // sync velocity
      const linvel = body.linvel();
      const velocity = node.physicsBody!.velocity;
      velocity[0] = linvel.x;
      velocity[1] = linvel.y;
      velocity[2] = linvel.z;
    }

    const isPlayer = hasComponent(ctx.world, Player, eid);

    if (bodyType === RAPIER.RigidBodyType.Dynamic || isPlayer) {
      applyRigidBodyToTransform(body, node);
    } else if (bodyType === RAPIER.RigidBodyType.KinematicPositionBased && !isPlayer) {
      updateMatrixWorld(node);

      getRotationNoAlloc(_worldQuat, node.worldMatrix);
      _q.fromArray(_worldQuat);
      body.setNextKinematicRotation(_q);
      mat4.getTranslation(_worldVec3, node.worldMatrix);
      _v.fromArray(_worldVec3);
      body.setNextKinematicTranslation(_v);
    }
  }

  updatePhysicsDebugBuffers(ctx, () => physicsWorld.debugRender());
}

const tempScale = vec3.create();

export function createNodeColliderDescriptions(node: RemoteNode): RAPIER.ColliderDesc[] {
  const collider = node.collider;

  if (!collider) {
    return [];
  }

  mat4.getScaling(tempScale, node.worldMatrix);

  const type = collider.type;

  const descriptions: RAPIER.ColliderDesc[] = [];

  if (type === ColliderType.Hull || type === ColliderType.Trimesh) {
    // TODO: Add mesh / primitive refCount
    const mesh = collider.mesh;

    if (!mesh) {
      throw new Error("Collider mesh cannot be found");
    }

    if (mesh.primitives.length === 0) {
      throw new Error("Mesh used for collider has zero primitives.");
    }

    for (const primitive of mesh.primitives) {
      const positionAccessor = primitive.attributes[MeshPrimitiveAttributeIndex.POSITION];

      if (!positionAccessor) {
        throw new Error("No position accessor found for collider.");
      }

      const positions = getAccessorArrayView(positionAccessor).slice() as Float32Array;
      scaleVec3Array(positions, positions, tempScale);

      if (type === ColliderType.Hull) {
        const hullDesc = RAPIER.ColliderDesc.convexHull(positions);

        if (!hullDesc) {
          throw new Error("Failed to construct convex hull");
        }

        hullDesc.setSensor(collider.isTrigger);

        if (collider.activeEvents) hullDesc.setActiveEvents(collider.activeEvents);
        if (collider.collisionGroups) hullDesc.setCollisionGroups(collider.collisionGroups);
        if (collider.restitution) hullDesc.setRestitution(collider.restitution);
        if (collider.density) hullDesc.setDensity(collider.density);

        descriptions.push(hullDesc);
      } else {
        let indices: Uint32Array;

        if (primitive.indices) {
          const indicesView = getAccessorArrayView(primitive.indices);
          indices = indicesView instanceof Uint32Array ? indicesView : new Uint32Array(indicesView);
        } else {
          indices = new Uint32Array(positions.length / 3);

          for (let i = 0; i < indices.length; i++) {
            indices[i] = i;
          }
        }

        // TODO: Figure out if we still need to apply the world matrix to the trimesh vertices
        const meshDesc = RAPIER.ColliderDesc.trimesh(positions, indices);

        meshDesc.setSensor(collider.isTrigger);

        if (collider.activeEvents) meshDesc.setActiveEvents(collider.activeEvents);
        if (collider.collisionGroups) meshDesc.setCollisionGroups(collider.collisionGroups);
        if (collider.restitution) meshDesc.setRestitution(collider.restitution);
        if (collider.density) meshDesc.setDensity(collider.density);

        descriptions.push(meshDesc);
      }
    }
  } else {
    let desc: RAPIER.ColliderDesc;

    if (type === ColliderType.Box) {
      const size = vec3.mul(tempScale, tempScale, collider.size);
      desc = RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2);
    } else if (type === ColliderType.Capsule) {
      desc = RAPIER.ColliderDesc.capsule((collider.height * tempScale[0]) / 2, collider.radius * tempScale[0]);
    } else if (type === ColliderType.Cylinder) {
      desc = RAPIER.ColliderDesc.cylinder((collider.height * tempScale[0]) / 2, collider.radius * tempScale[0]);
    } else if (type === ColliderType.Sphere) {
      desc = RAPIER.ColliderDesc.ball(collider.radius * tempScale[0]);
    } else {
      throw new Error(`Unimplemented collider type ${type}`);
    }

    desc.setSensor(collider.isTrigger);

    if (collider.activeEvents) desc.setActiveEvents(collider.activeEvents);
    if (collider.collisionGroups) desc.setCollisionGroups(collider.collisionGroups);
    if (collider.restitution) desc.setRestitution(collider.restitution);
    if (collider.density) desc.setDensity(collider.density);

    descriptions.push(desc);
  }

  return descriptions;
}

const tempPosition = vec3.create();
const tempRotation = quat.create();

export function addPhysicsCollider(world: World, node: RemoteNode, physicsCollider: RemoteCollider) {
  node.collider = physicsCollider;
  addComponent(world, RemoteCollider, node.eid);
}

export function removePhysicsCollider(world: World, node: RemoteNode) {
  node.collider = undefined;
  removeComponent(world, RemoteCollider, node.eid);
}

export function addPhysicsBody(
  world: World,
  physics: PhysicsModuleState,
  node: RemoteNode,
  physicsBody: RemotePhysicsBody
) {
  const { physicsWorld, handleToEid } = physics;

  node.physicsBody = physicsBody;
  addComponent(world, RemotePhysicsBody, node.eid);

  updateMatrixWorld(node);

  let rigidBodyDesc: RigidBodyDesc;

  if (physicsBody.type == PhysicsBodyType.Static) {
    rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
    addComponent(world, StaticBody, node.eid);
  } else if (physicsBody.type == PhysicsBodyType.Kinematic) {
    rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
    addComponent(world, KinematicBody, node.eid);
  } else if (physicsBody.type == PhysicsBodyType.Rigid) {
    rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
    addComponent(world, RigidBody, node.eid);

    rigidBodyDesc.setLinvel(
      physicsBody.linearVelocity[0],
      physicsBody.linearVelocity[1],
      physicsBody.linearVelocity[2]
    );

    rigidBodyDesc.setAngvel(
      new RAPIER.Vector3(physicsBody.angularVelocity[0], physicsBody.angularVelocity[1], physicsBody.angularVelocity[2])
    );
  } else {
    throw new Error(`Unsupported physics body type: "${physicsBody.type}"`);
  }

  const body = physicsWorld.createRigidBody(rigidBodyDesc);

  node.physicsBody.body = body;

  if (node.collider) {
    const colliderDescriptions = createNodeColliderDescriptions(node);

    for (const colliderDesc of colliderDescriptions) {
      if (physicsBody.type == PhysicsBodyType.Static) {
        colliderDesc.setCollisionGroups(staticRigidBodyCollisionGroups);

        const worldMatrix = node.worldMatrix;
        mat4.getTranslation(tempPosition, worldMatrix);
        vec3.add(tempPosition, tempPosition, node.collider.offset);
        getRotationNoAlloc(tempRotation, worldMatrix);
        colliderDesc.setTranslation(tempPosition[0], tempPosition[1], tempPosition[2]);
        colliderDesc.setRotation(
          new RAPIER.Quaternion(tempRotation[0], tempRotation[1], tempRotation[2], tempRotation[3])
        );
      } else if (physicsBody.type === PhysicsBodyType.Rigid) {
        colliderDesc.setCollisionGroups(dynamicObjectCollisionGroups);
      } else if (physicsBody.type === PhysicsBodyType.Kinematic) {
        colliderDesc.setCollisionGroups(staticRigidBodyCollisionGroups);

        const offset = node.collider.offset;
        colliderDesc.setTranslation(offset[0], offset[1], offset[2]);
      }

      if (node.collider.activeEvents) colliderDesc.setActiveEvents(node.collider.activeEvents);
      if (node.collider.collisionGroups) colliderDesc.setCollisionGroups(node.collider.collisionGroups);
      if (node.collider.restitution) colliderDesc.setRestitution(node.collider.restitution);
      if (node.collider.density) colliderDesc.setDensity(node.collider.density);

      colliderDesc.setMass(physicsBody.mass || 1);

      const collider = physicsWorld.createCollider(colliderDesc, body);
      handleToEid.set(collider.handle, node.eid);
    }
  }

  let curChild = node.firstChild;

  while (curChild) {
    updateMatrixWorld(curChild);

    if (curChild.collider) {
      const colliderDescriptions = createNodeColliderDescriptions(curChild);

      for (const colliderDesc of colliderDescriptions) {
        if (physicsBody.type == PhysicsBodyType.Static) {
          const worldMatrix = node.worldMatrix;
          mat4.getTranslation(tempPosition, worldMatrix);
          vec3.add(tempPosition, tempPosition, curChild.collider.offset);
          getRotationNoAlloc(tempRotation, worldMatrix);
          colliderDesc.setTranslation(tempPosition[0], tempPosition[1], tempPosition[2]);
          colliderDesc.setRotation(
            new RAPIER.Quaternion(tempRotation[0], tempRotation[1], tempRotation[2], tempRotation[3])
          );
        } else {
          vec3.copy(tempPosition, curChild.position);
          vec3.add(tempPosition, tempPosition, curChild.collider.offset);
          colliderDesc.setTranslation(tempPosition[0], tempPosition[1], tempPosition[2]);
          colliderDesc.setRotation(
            new RAPIER.Quaternion(
              curChild.quaternion[0],
              curChild.quaternion[1],
              curChild.quaternion[2],
              curChild.quaternion[3]
            )
          );
        }

        colliderDesc.setMass(physicsBody.mass || 1);
        colliderDesc.setCollisionGroups(staticRigidBodyCollisionGroups);

        if (curChild.collider.activeEvents) colliderDesc.setActiveEvents(curChild.collider.activeEvents);
        if (curChild.collider.collisionGroups) colliderDesc.setCollisionGroups(curChild.collider.collisionGroups);
        if (curChild.collider.restitution) colliderDesc.setRestitution(curChild.collider.restitution);
        if (curChild.collider.density) colliderDesc.setDensity(curChild.collider.density);

        const collider = physicsWorld.createCollider(colliderDesc, body);
        handleToEid.set(collider.handle, curChild.eid);
      }
    }

    curChild = curChild.nextSibling;
  }
}

export function removePhysicsBody(world: World, node: RemoteNode) {
  node.physicsBody = undefined;
  removeComponent(world, RemotePhysicsBody, node.eid);
}

export function registerCollisionHandler(ctx: GameContext, handler: CollisionHandler) {
  const { collisionHandlers } = getModule(ctx, PhysicsModule);

  collisionHandlers.push(handler);

  return () => {
    const index = collisionHandlers.indexOf(handler);

    if (index !== -1) {
      collisionHandlers.splice(index, 1);
    }
  };
}
