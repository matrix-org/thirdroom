import { addComponent, addEntity, IComponent } from "bitecs";
import { vec3, quat, mat4 } from "gl-matrix";

import { gameBuffer, renderableBuffer } from ".";
import { addView, addViewVector3, addViewMatrix4, addViewVector4 } from "../allocator/CursorBuffer";
import { maxEntities, NOOP } from "../config";
import { World } from "../GameWorker";

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

export function createTransformEntity(world: World) {
  const eid = addEntity(world);
  addTransformComponent(world, eid);
  return eid;
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

export const updateWorldMatrix = (eid: number, updateParents: boolean, updateChildren: boolean) => {
  const parent = Transform.parent[eid];

  if (updateParents === true && parent !== NOOP) {
    updateWorldMatrix(parent, true, false);
  }

  if (!Transform.static[eid]) updateMatrix(eid);

  if (parent === NOOP) {
    Transform.worldMatrix[eid].set(Transform.localMatrix[eid]);
  } else {
    mat4.multiply(Transform.worldMatrix[eid], Transform.worldMatrix[parent], Transform.localMatrix[eid]);
  }

  // update children
  if (updateChildren) {
    let nextChild = Transform.firstChild[eid];
    while (nextChild) {
      updateWorldMatrix(nextChild, false, true);
      nextChild = Transform.nextSibling[nextChild];
    }
  }
};

export const updateMatrixWorld = (eid: number, force = false) => {
  if (!Transform.static[eid]) updateMatrix(eid);

  if (Transform.worldMatrixNeedsUpdate[eid] || force) {
    const parent = Transform.parent[eid];
    if (parent === NOOP) {
      Transform.worldMatrix[eid].set(Transform.localMatrix[eid]);
    } else {
      mat4.multiply(Transform.worldMatrix[eid], Transform.worldMatrix[parent], Transform.localMatrix[eid]);
    }
    // Transform.worldMatrixNeedsUpdate[eid] = 0;
    force = true;
  }

  let nextChild = Transform.firstChild[eid];
  while (nextChild) {
    updateMatrixWorld(nextChild, force);
    nextChild = Transform.nextSibling[nextChild];
  }
};

export const updateMatrix = (eid: number) => {
  const position = Transform.position[eid];
  const quaternion = Transform.quaternion[eid];
  const scale = Transform.scale[eid];
  mat4.fromRotationTranslationScale(Transform.localMatrix[eid], quaternion, position, scale);
  Transform.worldMatrixNeedsUpdate[eid] = 1;
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

export function traverse(rootEid: number, callback: (eid: number) => void) {
  let eid = rootEid;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    callback(eid);

    const firstChild = Transform.firstChild[eid];

    if (firstChild) {
      eid = firstChild;
    } else {
      while (!Transform.nextSibling[eid]) {
        if (eid === rootEid) {
          return;
        }

        eid = Transform.parent[eid];
      }

      eid = Transform.nextSibling[eid];
    }
  }
}

export function* getChildren(parentEid: number): Generator<number, number> {
  let eid = Transform.firstChild[parentEid];

  while (eid) {
    yield eid;
    eid = Transform.nextSibling[eid];
  }

  return 0;
}
