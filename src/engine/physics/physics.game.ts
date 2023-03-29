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
import RAPIER, { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";

import { GameState, World } from "../GameTypes";
import { defineMapComponent } from "../ecs/MapComponent";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { addResourceRef, getRemoteResource, removeResourceRef } from "../resource/resource.game";
import { RemoteMesh, RemoteMeshPrimitive, RemoteNode } from "../resource/RemoteResources";
import { maxEntities } from "../config.common";
import { ColliderType, MeshPrimitiveAttributeIndex } from "../resource/schema";
import { getAccessorArrayView } from "../accessor/accessor.common";
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

export interface PhysicsModuleState {
  debugRender: boolean;
  debugRenderTripleBuffer?: PhysicsDebugRenderTripleBuffer;
  physicsWorld: RAPIER.World;
  eventQueue: RAPIER.EventQueue;
  handleToEid: Map<number, number>;
  characterCollision: RAPIER.CharacterCollision;
  collisionHandlers: ((eid1: number, eid2: number, handle1: number, handle2: number) => void)[];
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

      handleToEid.set(body.handle, eid);
    }
  }

  // remove rigidbody from physics world
  const exited = exitedRigidBodyQuery(world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    const body = RigidBody.store.get(eid);
    if (body) {
      handleToEid.delete(body.handle);
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

  eventQueue.drainCollisionEvents((handle1: number, handle2: number) => {
    const eid1 = handleToEid.get(handle1);
    const eid2 = handleToEid.get(handle2);

    if (eid1 === undefined || eid2 === undefined) {
      return;
    }

    for (const collisionHandler of collisionHandlers) {
      collisionHandler(eid1, eid2, handle1, handle2);
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

export function createNodeColliderDesc(node: RemoteNode): RAPIER.ColliderDesc | undefined {
  const collider = node.collider;

  if (!collider) {
    return undefined;
  }

  mat4.getScaling(tempScale, node.worldMatrix);

  const type = collider.type;

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
  } else if (type === ColliderType.Hull || type === ColliderType.Trimesh) {
    // TODO: Add mesh / primitive refCount
    const mesh = node.mesh;

    if (!mesh) {
      throw new Error("Collider mesh cannot be found");
    }

    if (mesh.primitives.length === 0) {
      throw new Error("Mesh used for collider has zero primitives.");
    } else if (mesh.primitives.length > 0) {
      console.warn("Mesh used for collider has more than one primitive. Only the first primitive will be used.");
    }

    const primitive = mesh.primitives[0];

    const positionAccessor = primitive.attributes[MeshPrimitiveAttributeIndex.POSITION];

    if (!positionAccessor) {
      throw new Error("No position accessor found for collider.");
    }

    const positions = getAccessorArrayView(positionAccessor) as Float32Array;

    if (type === ColliderType.Hull) {
      const hullDesc = RAPIER.ColliderDesc.convexHull(positions);

      if (!hullDesc) {
        throw new Error("Failed to construct convex hull");
      }

      desc = hullDesc;
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
      desc = RAPIER.ColliderDesc.trimesh(positions, indices);
    }
  } else {
    throw new Error(`Unimplemented collider type ${type}`);
  }

  desc.setSensor(collider.isTrigger);

  return desc;
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
