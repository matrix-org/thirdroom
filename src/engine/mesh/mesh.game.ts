import RAPIER from "@dimforge/rapier3d-compat";
import { BufferGeometry, BoxGeometry, SphereGeometry, TubeGeometry, Curve, Vector3 } from "three";

import { addInteractableComponent } from "../../plugins/interaction/interaction.game";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { dynamicObjectCollisionGroups } from "../physics/CollisionGroups";
import { PhysicsModule, addRigidBody } from "../physics/physics.game";
import {
  RemoteAccessor,
  RemoteBuffer,
  RemoteBufferView,
  RemoteMaterial,
  RemoteMesh,
  RemoteMeshPrimitive,
  RemoteNode,
} from "../resource/RemoteResources";
import {
  AccessorComponentType,
  AccessorType,
  MaterialType,
  InteractableType,
  MeshPrimitiveAttributeIndex,
  MaterialAlphaMode,
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

  const bufferView = new RemoteBufferView(ctx.resourceManager, {
    buffer: new RemoteBuffer(ctx.resourceManager, {
      data,
    }),
    byteLength: data.byteLength,
  });

  const remoteMesh = new RemoteMesh(ctx.resourceManager, {
    primitives: [
      new RemoteMeshPrimitive(ctx.resourceManager, {
        indices: new RemoteAccessor(ctx.resourceManager, {
          type: AccessorType.SCALAR,
          componentType: AccessorComponentType.Uint16,
          bufferView,
          count: indices.length,
        }),
        attributes: {
          [MeshPrimitiveAttributeIndex.POSITION]: new RemoteAccessor(ctx.resourceManager, {
            type: AccessorType.VEC3,
            componentType: AccessorComponentType.Float32,
            bufferView,
            byteOffset: position.byteOffset,
            count: position.length / 3,
          }),
          [MeshPrimitiveAttributeIndex.NORMAL]: new RemoteAccessor(ctx.resourceManager, {
            type: AccessorType.VEC3,
            componentType: AccessorComponentType.Float32,
            bufferView,
            byteOffset: normal.byteOffset,
            count: normal.length / 3,
            normalized: true,
          }),
          [MeshPrimitiveAttributeIndex.TEXCOORD_0]: new RemoteAccessor(ctx.resourceManager, {
            type: AccessorType.VEC2,
            componentType: AccessorComponentType.Float32,
            bufferView,
            byteOffset: uv.byteOffset,
            count: uv.length / 2,
          }),
        },
        material:
          material ||
          new RemoteMaterial(ctx.resourceManager, {
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

class StraightLine extends Curve<Vector3> {
  scale;
  constructor(scale = 1) {
    super();
    this.scale = scale;
  }

  getPoint(t: number, optionalTarget = new Vector3()) {
    return optionalTarget.set(0, 0, t).multiplyScalar(this.scale);
  }
}
export const createLineMesh = (ctx: GameState, length: number, thickness = 0.01, material?: RemoteMaterial) => {
  const geometry = new TubeGeometry(new StraightLine(-length), 1, thickness, 3);
  return createMesh(ctx, geometry, material);
};

export function createLine(ctx: GameState, length = 10, thickness = 0.2) {
  const rayMaterial = new RemoteMaterial(ctx.resourceManager, {
    type: MaterialType.Standard,
    baseColorFactor: [0, 1, 0.2, 1],
    emissiveFactor: [0.7, 0.7, 0.7],
    metallicFactor: 0,
    roughnessFactor: 0,
    alphaMode: MaterialAlphaMode.BLEND,
  });
  const mesh = createLineMesh(ctx, length, thickness, rayMaterial);
  const node = new RemoteNode(ctx.resourceManager, {
    mesh,
  });
  return node;
}

export const createPhysicsCube = (
  ctx: GameState,
  size: number,
  material?: RemoteMaterial,
  remote = false
): RemoteNode => {
  const physics = getModule(ctx, PhysicsModule);
  const { physicsWorld } = physics;
  const node = new RemoteNode(ctx.resourceManager, {
    mesh: createCubeMesh(ctx, size, material),
  });

  const rigidBodyDesc = remote ? RAPIER.RigidBodyDesc.kinematicPositionBased() : RAPIER.RigidBodyDesc.dynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, size / 2, size / 2)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
    .setCollisionGroups(dynamicObjectCollisionGroups);

  physicsWorld.createCollider(colliderDesc, rigidBody);

  addRigidBody(ctx, node, rigidBody);

  addInteractableComponent(ctx, physics, node, InteractableType.Grabbable);

  return node;
};

export const createSimpleCube = (ctx: GameState, size: number, material?: RemoteMaterial) => {
  return new RemoteNode(ctx.resourceManager, {
    mesh: createCubeMesh(ctx, size, material),
  });
};
