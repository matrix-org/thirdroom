import { addComponent, IComponent } from "bitecs";
import { vec3, quat, mat4 } from "gl-matrix";

import { gameBuffer, renderableBuffer } from ".";
import { addView, addViewVector3, addViewMatrix4, addViewVector4 } from "../allocator/CursorBuffer";
import { maxEntities, NOOP } from "../config";
import { GameState, World } from "../GameWorker";
import { WorkerMessageType } from "../WorkerMessage";

export interface Transform extends IComponent {
  position: Float32Array[];
  rotation: Float32Array[];
  quaternion: Float32Array[];
  scale: Float32Array[];

  localMatrix: Float32Array[];
  worldMatrix: Float32Array[];
  static: Uint8Array;
  worldMatrixNeedsUpdate: Uint8Array;

  parent: Uint32Array;
  firstChild: Uint32Array;
  prevSibling: Uint32Array;
  nextSibling: Uint32Array;
}

export const Transform: Transform = {
  position: addViewVector3(gameBuffer, maxEntities),
  scale: addViewVector3(gameBuffer, maxEntities),
  rotation: addViewVector3(gameBuffer, maxEntities),
  quaternion: addViewVector4(gameBuffer, maxEntities),

  localMatrix: addViewMatrix4(gameBuffer, maxEntities),
  worldMatrix: addViewMatrix4(renderableBuffer, maxEntities),
  static: addView(gameBuffer, Uint8Array, maxEntities),
  worldMatrixNeedsUpdate: addView(renderableBuffer, Uint8Array, maxEntities),

  parent: addView(gameBuffer, Uint32Array, maxEntities),
  firstChild: addView(gameBuffer, Uint32Array, maxEntities),
  prevSibling: addView(gameBuffer, Uint32Array, maxEntities),
  nextSibling: addView(gameBuffer, Uint32Array, maxEntities),
};

export function addTransformComponent(world: World, eid: number) {
  addComponent(world, Transform, eid);
  vec3.set(Transform.scale[eid], 1, 1, 1);
  quat.identity(Transform.quaternion[eid]);
  mat4.identity(Transform.localMatrix[eid]);
  mat4.identity(Transform.worldMatrix[eid]);
  Transform.worldMatrixNeedsUpdate[eid] = 1;
}

export interface Renderable extends IComponent {
  resourceId: Uint32Array;
  interpolate: Uint8Array;
}

export const Renderable: Renderable = {
  resourceId: addView(renderableBuffer, Uint32Array, maxEntities),
  interpolate: addView(renderableBuffer, Uint8Array, maxEntities),
};

export function addRenderableComponent({ world, renderer: { port } }: GameState, eid: number, resourceId: number) {
  addComponent(world, Renderable, eid);
  Renderable.interpolate[eid] = 1;
  Renderable.resourceId[eid] = resourceId;
  port.postMessage({ type: WorkerMessageType.AddRenderable, eid, resourceId });
}

export function getLastChild(eid: number): number {
  let cursor = Transform.firstChild[eid];
  let last = cursor;

  while (cursor) {
    last = cursor;
    cursor = Transform.nextSibling[cursor];
  }

  return last;
}

export function getChildAt(eid: number, index: number): number {
  let cursor = Transform.firstChild[eid];

  if (cursor) {
    for (let i = 1; i <= index; i++) {
      cursor = Transform.nextSibling[cursor];

      if (!cursor) {
        return 0;
      }
    }
  }

  return cursor;
}

export function addChild(parent: number, child: number) {
  Transform.parent[child] = parent;

  const lastChild = getLastChild(parent);

  if (lastChild) {
    Transform.nextSibling[lastChild] = child;
    Transform.prevSibling[child] = lastChild;
    Transform.nextSibling[child] = NOOP;
  } else {
    Transform.firstChild[parent] = child;
    Transform.prevSibling[child] = NOOP;
    Transform.nextSibling[child] = NOOP;
  }
}

export function removeChild(parent: number, child: number) {
  const prevSibling = Transform.prevSibling[child];
  const nextSibling = Transform.nextSibling[child];

  const firstChild = Transform.firstChild[parent];
  if (firstChild === child) {
    Transform.firstChild[parent] = NOOP;
  }

  // [prev, child, next]
  if (prevSibling !== NOOP && nextSibling !== NOOP) {
    Transform.nextSibling[prevSibling] = nextSibling;
    Transform.prevSibling[nextSibling] = prevSibling;
  }
  // [prev, child]
  if (prevSibling !== NOOP && nextSibling === NOOP) {
    Transform.nextSibling[prevSibling] = NOOP;
  }
  // [child, next]
  if (nextSibling !== NOOP && prevSibling === NOOP) {
    Transform.prevSibling[nextSibling] = NOOP;
    Transform.firstChild[parent] = nextSibling;
  }

  Transform.parent[child] = NOOP;
  Transform.nextSibling[child] = NOOP;
  Transform.prevSibling[child] = NOOP;
}

const updateWorldMatrix = (eid: number, force = false) => {
  if (Transform.worldMatrixNeedsUpdate[eid] || force) {
    if (Transform.parent[eid] === NOOP) {
      Transform.worldMatrix[eid].set(Transform.localMatrix[eid]);
    } else {
      const parentEid = Transform.parent[eid];
      mat4.multiply(Transform.worldMatrix[eid], Transform.worldMatrix[parentEid], Transform.localMatrix[eid]);
    }
    Transform.worldMatrixNeedsUpdate[eid] = 0;
    force = true;
  }
  return force;
};

export const updateMatrixWorld = (eid: number, force = false) => {
  if (!Transform.static[eid]) updateMatrix(eid);

  force = updateWorldMatrix(eid, force);

  let nextChild = Transform.firstChild[eid];
  while (nextChild) {
    updateMatrixWorld(nextChild, force);

    nextChild = Transform.nextSibling[nextChild];
  }
};

export const updateMatrix = (eid: number) => {
  composeMatrix(eid);
  Transform.worldMatrixNeedsUpdate[eid] = 1;
};

export const composeMatrix = (eid: number) => {
  const position = Transform.position[eid];
  const quaternion = Transform.quaternion[eid];
  const scale = Transform.scale[eid];

  const te = Transform.localMatrix[eid];

  const x = quaternion[0];
  const y = quaternion[1];
  const z = quaternion[2];
  const w = quaternion[3];

  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;

  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;

  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;

  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;

  const sx = scale[0];
  const sy = scale[1];
  const sz = scale[2];

  te[0] = (1 - (yy + zz)) * sx;
  te[1] = (xy + wz) * sx;
  te[2] = (xz - wy) * sx;
  te[3] = 0;

  te[4] = (xy - wz) * sy;
  te[5] = (1 - (xx + zz)) * sy;
  te[6] = (yz + wx) * sy;
  te[7] = 0;

  te[8] = (xz + wy) * sz;
  te[9] = (yz - wx) * sz;
  te[10] = (1 - (xx + yy)) * sz;
  te[11] = 0;

  te[12] = position[0];
  te[13] = position[1];
  te[14] = position[2];
  te[15] = 1;
};

const { sin, cos } = Math;

const EulerOrder = ["XYZ", "YZX", "ZXY", "XZY", "YXZ", "ZYX"];

export const setQuaternionFromEuler = (quaternion: Float32Array, rotation: Float32Array) => {
  const [x, y, z, o] = rotation;
  const order = EulerOrder[o] || "XYZ";

  const c1 = cos(x / 2);
  const c2 = cos(y / 2);
  const c3 = cos(z / 2);

  const s1 = sin(x / 2);
  const s2 = sin(y / 2);
  const s3 = sin(z / 2);

  switch (order) {
    case "XYZ":
      quaternion[0] = s1 * c2 * c3 + c1 * s2 * s3;
      quaternion[1] = c1 * s2 * c3 - s1 * c2 * s3;
      quaternion[2] = c1 * c2 * s3 + s1 * s2 * c3;
      quaternion[3] = c1 * c2 * c3 - s1 * s2 * s3;
      break;

    case "YXZ":
      quaternion[0] = s1 * c2 * c3 + c1 * s2 * s3;
      quaternion[1] = c1 * s2 * c3 - s1 * c2 * s3;
      quaternion[2] = c1 * c2 * s3 - s1 * s2 * c3;
      quaternion[3] = c1 * c2 * c3 + s1 * s2 * s3;
      break;

    case "ZXY":
      quaternion[0] = s1 * c2 * c3 - c1 * s2 * s3;
      quaternion[1] = c1 * s2 * c3 + s1 * c2 * s3;
      quaternion[2] = c1 * c2 * s3 + s1 * s2 * c3;
      quaternion[3] = c1 * c2 * c3 - s1 * s2 * s3;
      break;

    case "ZYX":
      quaternion[0] = s1 * c2 * c3 - c1 * s2 * s3;
      quaternion[1] = c1 * s2 * c3 + s1 * c2 * s3;
      quaternion[2] = c1 * c2 * s3 - s1 * s2 * c3;
      quaternion[3] = c1 * c2 * c3 + s1 * s2 * s3;
      break;

    case "YZX":
      quaternion[0] = s1 * c2 * c3 + c1 * s2 * s3;
      quaternion[1] = c1 * s2 * c3 + s1 * c2 * s3;
      quaternion[2] = c1 * c2 * s3 - s1 * s2 * c3;
      quaternion[3] = c1 * c2 * c3 - s1 * s2 * s3;
      break;

    case "XZY":
      quaternion[0] = s1 * c2 * c3 - c1 * s2 * s3;
      quaternion[1] = c1 * s2 * c3 - s1 * c2 * s3;
      quaternion[2] = c1 * c2 * s3 + s1 * s2 * c3;
      quaternion[3] = c1 * c2 * c3 + s1 * s2 * s3;
      break;
  }
};
