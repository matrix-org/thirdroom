import RAPIER from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";
import { BufferGeometry, BoxGeometry, SphereGeometry } from "three";

import { addInteractableComponent } from "../../plugins/interaction/interaction.game";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { addRemoteNodeComponent } from "../node/node.game";
import { dynamicObjectCollisionGroups } from "../physics/CollisionGroups";
import { PhysicsModule, addRigidBody } from "../physics/physics.game";
import {
  AccessorComponentType,
  AccessorType,
  BufferResource,
  BufferViewResource,
  MaterialResource,
  MaterialType,
  RemoteMaterial,
  RemoteMesh,
  InteractableType,
  AccessorResource,
  MeshResource,
  MeshPrimitiveResource,
  MeshPrimitiveAttributeIndex,
} from "../resource/schema";

export const createMesh = (ctx: GameState, geometry: BufferGeometry, material?: RemoteMaterial): RemoteMesh => {
  const indicesArr = geometry.index!.array as Uint16Array;
  const posArr = geometry.attributes.position.array as Float32Array;
  const normArr = geometry.attributes.normal.array as Float32Array;
  const uvArr = geometry.attributes.uv.array as Float32Array;

  const data = new SharedArrayBuffer(indicesArr.byteLength + posArr.byteLength + normArr.byteLength + uvArr.byteLength);

  const indices = new Uint16Array(data, 0, indicesArr.length);
  indices.set(indicesArr);
  const position = new Float32Array(data, indices.byteLength, posArr.length);
  position.set(posArr);
  const normal = new Float32Array(data, position.byteOffset + position.byteLength, normArr.length);
  normal.set(normArr);
  const uv = new Float32Array(data, normal.byteOffset + normal.byteLength, uvArr.length);
  uv.set(uvArr);

  const bufferView = ctx.resourceManager.createResource(BufferViewResource, {
    buffer: ctx.resourceManager.createResource(BufferResource, {
      data,
    }),
    byteLength: data.byteLength,
  });

  const remoteMesh = ctx.resourceManager.createResource(MeshResource, {
    primitives: [
      ctx.resourceManager.createResource(MeshPrimitiveResource, {
        indices: ctx.resourceManager.createResource(AccessorResource, {
          type: AccessorType.SCALAR,
          componentType: AccessorComponentType.Uint16,
          bufferView,
          count: indices.length,
        }),
        attributes: {
          [MeshPrimitiveAttributeIndex.POSITION]: ctx.resourceManager.createResource(AccessorResource, {
            type: AccessorType.VEC3,
            componentType: AccessorComponentType.Float32,
            bufferView,
            byteOffset: position.byteOffset,
            count: position.length / 3,
          }),
          [MeshPrimitiveAttributeIndex.NORMAL]: ctx.resourceManager.createResource(AccessorResource, {
            type: AccessorType.VEC3,
            componentType: AccessorComponentType.Float32,
            bufferView,
            byteOffset: normal.byteOffset,
            count: normal.length / 3,
            normalized: true,
          }),
          [MeshPrimitiveAttributeIndex.TEXCOORD_0]: ctx.resourceManager.createResource(AccessorResource, {
            type: AccessorType.VEC2,
            componentType: AccessorComponentType.Float32,
            bufferView,
            byteOffset: uv.byteOffset,
            count: uv.length / 2,
          }),
        },
        material:
          material ||
          ctx.resourceManager.createResource(MaterialResource, {
            type: MaterialType.Standard,
            baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
            roughnessFactor: 0.8,
            metallicFactor: 0.8,
          }),
      }),
    ],
  });

  return remoteMesh;
};

export const createCubeMesh = (ctx: GameState, size: number, material?: RemoteMaterial) => {
  const geometry = new BoxGeometry(size, size, size);
  return createMesh(ctx, geometry, material);
};

export const createSphereMesh = (ctx: GameState, radius: number, material?: RemoteMaterial) => {
  const geometry = new SphereGeometry(radius / 2);
  return createMesh(ctx, geometry, material);
};

export const createPhysicsCube = (ctx: GameState, size: number, material?: RemoteMaterial, remote = false) => {
  const physics = getModule(ctx, PhysicsModule);
  const { physicsWorld } = physics;
  const { world } = ctx;

  const eid = addEntity(world);

  ctx.resourceManager.createResource(MaterialResource, {
    type: MaterialType.Standard,
    baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
    roughnessFactor: 0.8,
    metallicFactor: 0.8,
  });

  addRemoteNodeComponent(ctx, eid, {
    mesh: createCubeMesh(ctx, size, material),
  });

  const rigidBodyDesc = remote ? RAPIER.RigidBodyDesc.newKinematicPositionBased() : RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, size / 2, size / 2)
    .setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS)
    .setCollisionGroups(dynamicObjectCollisionGroups);

  physicsWorld.createCollider(colliderDesc, rigidBody.handle);

  addRigidBody(ctx, eid, rigidBody);

  addInteractableComponent(ctx, physics, eid, InteractableType.Grabbable);

  return eid;
};

export const createSimpleCube = (ctx: GameState, size: number, material?: RemoteMaterial) => {
  const { world } = ctx;
  const eid = addEntity(world);

  ctx.resourceManager.createResource(MaterialResource, {
    type: MaterialType.Standard,
    baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
    roughnessFactor: 0.8,
    metallicFactor: 0.8,
  });

  addRemoteNodeComponent(ctx, eid, {
    mesh: createCubeMesh(ctx, size, material),
  });

  return eid;
};
