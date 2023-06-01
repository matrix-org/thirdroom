import { vec3, mat4, quat } from "gl-matrix";
import {
  defineComponent,
  defineQuery,
  addComponent,
  removeComponent,
  enterQuery,
  exitQuery,
  Types,
  hasComponent,
} from "bitecs";
import RAPIER, { RigidBody as RapierRigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";

import { GameState, World } from "../GameTypes";
import { defineMapComponent } from "../ecs/MapComponent";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { addResourceRef, getRemoteResource, removeResourceRef } from "../resource/resource.game";
import { RemoteMesh, RemoteMeshPrimitive, RemoteNode } from "../resource/RemoteResources";
import { maxEntities } from "../config.common";
import { ColliderType, MeshPrimitiveAttributeIndex, PhysicsBodyType } from "../resource/schema";
import { getAccessorArrayView, scaleVec3Array } from "../accessor/accessor.common";
import { updateMatrixWorld } from "../component/transform";
import { Player } from "../component/Player";
import {
  PhysicsDebugRenderTripleBuffer,
  PhysicsDisableDebugRenderMessage,
  PhysicsEnableDebugRenderMessage,
  PhysicsMessageType,
} from "./physics.common";
import {
  createObjectTripleBuffer,
  defineObjectBufferSchema,
  getWriteObjectBufferView,
} from "../allocator/ObjectBufferView";
import { createDisposables } from "../utils/createDisposables";
import { getRotationNoAlloc } from "../utils/getRotationNoAlloc";
import { InputControllerComponent } from "../input/InputControllerComponent";
import { dynamicObjectCollisionGroups, staticRigidBodyCollisionGroups } from "./CollisionGroups";

export type CollisionHandler = (eid1: number, eid2: number, handle1: number, handle2: number, started: boolean) => void;

export interface PhysicsModuleState {
  debugRender: boolean;
  debugRenderTripleBuffer?: PhysicsDebugRenderTripleBuffer;
  physicsWorld: RAPIER.World;
  eventQueue: RAPIER.EventQueue;
  handleToEid: Map<number, number>;
  characterCollision: RAPIER.CharacterCollision;
  collisionHandlers: CollisionHandler[];
  eidTocharacterController: Map<number, RAPIER.KinematicCharacterController>;
}

export const PhysicsModule = defineModule<GameState, PhysicsModuleState>({
  name: "physics",
  async create(_ctx, { waitForMessage }) {
    await RAPIER.init();

    const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
    const physicsWorld = new RAPIER.World(gravity);
    const handleToEid = new Map<number, number>();
    const eventQueue = new RAPIER.EventQueue(true);

    return {
      debugRender: false,
      debugRenderTripleBuffer: undefined,
      physicsWorld,
      eventQueue,
      handleToEid,
      collisionHandlers: [],
      characterCollision: new RAPIER.CharacterCollision(),
      eidTocharacterController: new Map<number, RAPIER.KinematicCharacterController>(),
    };
  },
  init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, PhysicsMessageType.TogglePhysicsDebug, onTogglePhysicsDebug),
    ]);
  },
});

function onTogglePhysicsDebug(ctx: GameState) {
  const physicsModule = getModule(ctx, PhysicsModule);
  physicsModule.debugRender = !physicsModule.debugRender;
}

const RigidBodySoA = defineComponent(
  {
    velocity: [Types.f32, 3],
    meshResourceId: Types.ui32,
    primitiveResourceId: Types.ui32,
  },
  maxEntities
);

// data flows from rigidbody->transform
export const RigidBody = defineMapComponent<RapierRigidBody, typeof RigidBodySoA>(RigidBodySoA);

export const rigidBodyQuery = defineQuery([RigidBody]);
export const enteredRigidBodyQuery = enterQuery(rigidBodyQuery);
export const exitedRigidBodyQuery = exitQuery(rigidBodyQuery);

// data flows from transform->rigidbody
export const Kinematic = defineComponent();

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

export function PhysicsSystem(ctx: GameState) {
  const { world, dt } = ctx;
  const physicsModule = getModule(ctx, PhysicsModule);

  const { physicsWorld, handleToEid, eventQueue, collisionHandlers, debugRender } = physicsModule;

  // apply transform to rigidbody for new physics entities
  const entered = enteredRigidBodyQuery(world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];

    const body = RigidBody.store.get(eid);
    const node = getRemoteResource<RemoteNode>(ctx, eid);

    if (body && node) {
      if (body.bodyType() !== RAPIER.RigidBodyType.Fixed) {
        applyTransformToRigidBody(body, node);
      }

      const colliderCount = body.numColliders();

      for (let i = 0; i < colliderCount; i++) {
        const collider = body.collider(i);
        handleToEid.set(collider.handle, eid);
      }
    }
  }

  // remove rigidbody from physics world
  const exited = exitedRigidBodyQuery(world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    const body = RigidBody.store.get(eid);
    if (body) {
      const colliderCount = body.numColliders();

      for (let i = 0; i < colliderCount; i++) {
        const collider = body.collider(i);
        handleToEid.delete(collider.handle);
      }

      physicsWorld.removeRigidBody(body);
      RigidBody.store.delete(eid);

      if (RigidBody.meshResourceId[eid]) {
        removeResourceRef(ctx, RigidBody.meshResourceId[eid]);
      }

      if (RigidBody.primitiveResourceId[eid]) {
        removeResourceRef(ctx, RigidBody.primitiveResourceId[eid]);
      }
    }
  }

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

  // apply rigidbody to transform for regular physics entities
  const physicsEntities = rigidBodyQuery(world);
  for (let i = 0; i < physicsEntities.length; i++) {
    const eid = physicsEntities[i];
    const body = RigidBody.store.get(eid);
    const node = getRemoteResource<RemoteNode>(ctx, eid);

    if (!node || !body) {
      continue;
    }

    const bodyType = body.bodyType();

    if (bodyType !== RAPIER.RigidBodyType.Fixed) {
      // sync velocity
      const linvel = body.linvel();
      const velocity = RigidBody.velocity[eid];
      velocity[0] = linvel.x;
      velocity[1] = linvel.y;
      velocity[2] = linvel.z;
    }

    const isPlayer = hasComponent(ctx.world, Player, eid);
    const hasInputController = hasComponent(ctx.world, InputControllerComponent, eid);

    if (bodyType === RAPIER.RigidBodyType.Dynamic || isPlayer) {
      applyRigidBodyToTransform(body, node);
    } else if (bodyType === RAPIER.RigidBodyType.KinematicPositionBased && !isPlayer && !hasInputController) {
      updateMatrixWorld(node);

      getRotationNoAlloc(_worldQuat, node.worldMatrix);
      _q.fromArray(_worldQuat);
      body.setNextKinematicRotation(_q);
      mat4.getTranslation(_worldVec3, node.worldMatrix);
      _v.fromArray(_worldVec3);
      body.setNextKinematicTranslation(_v);
    }
  }

  if (debugRender) {
    const buffers = physicsWorld.debugRender();

    if (!physicsModule.debugRenderTripleBuffer) {
      // Allow for double the number of vertices at the start.
      const initialSize = (buffers.vertices.length / 3) * 2;

      const physicsDebugRenderSchema = defineObjectBufferSchema({
        size: [Uint32Array, 1],
        vertices: [Float32Array, initialSize * 3],
        colors: [Float32Array, initialSize * 4],
      });

      const tripleBuffer = createObjectTripleBuffer(physicsDebugRenderSchema, ctx.gameToRenderTripleBufferFlags);

      physicsModule.debugRenderTripleBuffer = tripleBuffer;

      ctx.sendMessage<PhysicsEnableDebugRenderMessage>(Thread.Render, {
        type: PhysicsMessageType.PhysicsEnableDebugRender,
        tripleBuffer,
      });
    }

    const writeView = getWriteObjectBufferView(physicsModule.debugRenderTripleBuffer);
    writeView.size[0] = buffers.vertices.length / 3;
    writeView.vertices.set(buffers.vertices);
    writeView.colors.set(buffers.colors);
  } else if (physicsModule.debugRenderTripleBuffer) {
    ctx.sendMessage<PhysicsDisableDebugRenderMessage>(Thread.Render, {
      type: PhysicsMessageType.PhysicsDisableDebugRender,
    });
    physicsModule.debugRenderTripleBuffer = undefined;
  }
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

        hullDesc.setCollisionGroups(collider.collisionGroups);
        hullDesc.setSensor(collider.isTrigger);

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

        meshDesc.setCollisionGroups(collider.collisionGroups);
        meshDesc.setSensor(collider.isTrigger);

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

    desc.setCollisionGroups(collider.collisionGroups);
    desc.setSensor(collider.isTrigger);

    descriptions.push(desc);
  }

  return descriptions;
}

const tempPosition = vec3.create();
const tempRotation = quat.create();

export function addNodePhysicsBody(ctx: GameState, node: RemoteNode) {
  const physicsBody = node.physicsBody;

  if (!physicsBody) {
    throw new Error("Node does not have a physics body");
  }

  const { physicsWorld } = getModule(ctx, PhysicsModule);

  let rigidBodyDesc: RigidBodyDesc;

  if (physicsBody.type == PhysicsBodyType.Static) {
    rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
  } else if (physicsBody.type == PhysicsBodyType.Kinematic) {
    rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
  } else if (physicsBody.type == PhysicsBodyType.Rigid) {
    rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();

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

  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  if (node.collider) {
    const colliderDescriptions = createNodeColliderDescriptions(node);

    for (const colliderDesc of colliderDescriptions) {
      if (physicsBody.type == PhysicsBodyType.Static) {
        const worldMatrix = node.worldMatrix;
        mat4.getTranslation(tempPosition, worldMatrix);
        getRotationNoAlloc(tempRotation, worldMatrix);
        colliderDesc.setTranslation(tempPosition[0], tempPosition[1], tempPosition[2]);
        colliderDesc.setRotation(
          new RAPIER.Quaternion(tempRotation[0], tempRotation[1], tempRotation[2], tempRotation[3])
        );
        colliderDesc.setCollisionGroups(staticRigidBodyCollisionGroups);
      } else if (physicsBody.type === PhysicsBodyType.Rigid) {
        colliderDesc.setCollisionGroups(dynamicObjectCollisionGroups);
      } else if (physicsBody.type === PhysicsBodyType.Kinematic) {
        colliderDesc.setCollisionGroups(staticRigidBodyCollisionGroups);
      }

      colliderDesc.setMass(physicsBody.mass || 1);
      physicsWorld.createCollider(colliderDesc, rigidBody);
    }
  }

  let curChild = node.firstChild;

  while (curChild) {
    if (curChild.collider) {
      const colliderDescriptions = createNodeColliderDescriptions(curChild);

      for (const colliderDesc of colliderDescriptions) {
        if (physicsBody.type == PhysicsBodyType.Static) {
          const worldMatrix = node.worldMatrix;
          mat4.getTranslation(tempPosition, worldMatrix);
          getRotationNoAlloc(tempRotation, worldMatrix);
          colliderDesc.setTranslation(tempPosition[0], tempPosition[1], tempPosition[2]);
          colliderDesc.setRotation(
            new RAPIER.Quaternion(tempRotation[0], tempRotation[1], tempRotation[2], tempRotation[3])
          );
        } else {
          colliderDesc.setTranslation(curChild.position[0], curChild.position[1], curChild.position[2]);
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
        physicsWorld.createCollider(colliderDesc, rigidBody);
      }
    }

    curChild = curChild.nextSibling;
  }

  addRigidBody(ctx, node, rigidBody);
}

export function addRigidBody(
  ctx: GameState,
  node: RemoteNode,
  rigidBody: RapierRigidBody,
  meshResource?: RemoteMesh,
  primitiveResource?: RemoteMeshPrimitive
) {
  addComponent(ctx.world, RigidBody, node.eid);
  RigidBody.store.set(node.eid, rigidBody);

  if (meshResource) {
    addResourceRef(ctx, meshResource.eid);
    RigidBody.meshResourceId[node.eid] = meshResource.eid;
  }

  if (primitiveResource) {
    addResourceRef(ctx, primitiveResource.eid);
    RigidBody.primitiveResourceId[node.eid] = primitiveResource.eid;
  }
}

export function removeRigidBody(world: World, eid: number) {
  removeComponent(world, RigidBody, eid);
  RigidBody.store.delete(eid);
}

export function registerCollisionHandler(ctx: GameState, handler: CollisionHandler) {
  const { collisionHandlers } = getModule(ctx, PhysicsModule);

  collisionHandlers.push(handler);

  return () => {
    const index = collisionHandlers.indexOf(handler);

    if (index !== -1) {
      collisionHandlers.splice(index, 1);
    }
  };
}
