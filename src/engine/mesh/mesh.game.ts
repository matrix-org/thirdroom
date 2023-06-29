import { BufferGeometry, BoxGeometry, SphereGeometry, TubeGeometry, Curve, Vector3 } from "three";

import { GameContext } from "../GameTypes";
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
  MeshPrimitiveAttributeIndex,
  MaterialAlphaMode,
} from "../resource/schema";

export const createMesh = (
  ctx: GameContext,
  geometry: BufferGeometry,
  material?: RemoteMaterial,
  resourceManager = ctx.resourceManager
): RemoteMesh => {
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

  const bufferView = new RemoteBufferView(resourceManager, {
    buffer: new RemoteBuffer(resourceManager, {
      data,
    }),
    byteLength: data.byteLength,
  });

  const remoteMesh = new RemoteMesh(resourceManager, {
    primitives: [
      new RemoteMeshPrimitive(resourceManager, {
        indices: new RemoteAccessor(resourceManager, {
          type: AccessorType.SCALAR,
          componentType: AccessorComponentType.Uint16,
          bufferView,
          count: indices.length,
        }),
        attributes: {
          [MeshPrimitiveAttributeIndex.POSITION]: new RemoteAccessor(resourceManager, {
            type: AccessorType.VEC3,
            componentType: AccessorComponentType.Float32,
            bufferView,
            byteOffset: position.byteOffset,
            count: position.length / 3,
          }),
          [MeshPrimitiveAttributeIndex.NORMAL]: new RemoteAccessor(resourceManager, {
            type: AccessorType.VEC3,
            componentType: AccessorComponentType.Float32,
            bufferView,
            byteOffset: normal.byteOffset,
            count: normal.length / 3,
            normalized: true,
          }),
          [MeshPrimitiveAttributeIndex.TEXCOORD_0]: new RemoteAccessor(resourceManager, {
            type: AccessorType.VEC2,
            componentType: AccessorComponentType.Float32,
            bufferView,
            byteOffset: uv.byteOffset,
            count: uv.length / 2,
          }),
        },
        material,
      }),
    ],
  });

  return remoteMesh;
};

export const createCubeMesh = (ctx: GameContext, size: number, material?: RemoteMaterial) => {
  const geometry = new BoxGeometry(size, size, size);
  return createMesh(ctx, geometry, material);
};

export const createSphereMesh = (ctx: GameContext, radius: number, material?: RemoteMaterial) => {
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
export const createLineMesh = (ctx: GameContext, length: number, thickness = 0.01, material?: RemoteMaterial) => {
  const geometry = new TubeGeometry(new StraightLine(-length), 1, thickness, 3);
  return createMesh(ctx, geometry, material);
};

export function createLine(ctx: GameContext, length = 10, thickness = 0.2) {
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

export const createSimpleCube = (ctx: GameContext, size: number, material?: RemoteMaterial) => {
  return new RemoteNode(ctx.resourceManager, {
    mesh: createCubeMesh(ctx, size, material),
  });
};
