import {
  addComponent,
  addEntity,
  defineComponent,
  defineQuery,
  entityExists,
  getEntityComponents,
  IComponent,
  removeComponent,
  removeEntity,
} from "bitecs";
import { vec3, quat, mat4 } from "gl-matrix";

import { maxEntities, NOOP } from "../config.common";
import { GameState, World } from "../GameTypes";
import { createObjectBufferView } from "../allocator/ObjectBufferView";
import { hierarchyObjectBufferSchema } from "./transform.common";
import { Networked } from "../network/network.game";
import { RigidBody } from "../physics/physics.game";

export const Hidden = defineComponent();

export interface Transform extends IComponent {
  position: Float32Array[];
  rotation: Float32Array[];
  quaternion: Float32Array[];
  scale: Float32Array[];

  localMatrix: Float32Array[];
  worldMatrix: Float32Array[];
  static: Uint8Array;
  skipLerp: Uint8Array;
  worldMatrixNeedsUpdate: Uint8Array;

  parent: Uint32Array;
  firstChild: Uint32Array;
  prevSibling: Uint32Array;
  nextSibling: Uint32Array;
  hierarchyUpdated: Uint8Array;
}

export const gameObjectBuffer = createObjectBufferView(
  {
    position: [Float32Array, maxEntities, 3],
    scale: [Float32Array, maxEntities, 3],
    rotation: [Float32Array, maxEntities, 3],
    quaternion: [Float32Array, maxEntities, 4],
    localMatrix: [Float32Array, maxEntities, 16],
    worldMatrix: [Float32Array, maxEntities, 16],
    worldMatrixNeedsUpdate: [Uint8Array, maxEntities],
    static: [Uint8Array, maxEntities],
    skipLerp: [Uint8Array, maxEntities],
  },
  ArrayBuffer
);

export const hierarchyObjectBuffer = createObjectBufferView(hierarchyObjectBufferSchema, ArrayBuffer);

export const Transform: Transform = {
  position: gameObjectBuffer.position,
  scale: gameObjectBuffer.scale,
  rotation: gameObjectBuffer.rotation,
  quaternion: gameObjectBuffer.quaternion,
  localMatrix: gameObjectBuffer.localMatrix,
  static: gameObjectBuffer.static,
  skipLerp: gameObjectBuffer.skipLerp,

  worldMatrix: gameObjectBuffer.worldMatrix,
  worldMatrixNeedsUpdate: gameObjectBuffer.worldMatrixNeedsUpdate,

  parent: hierarchyObjectBuffer.parent,
  firstChild: hierarchyObjectBuffer.firstChild,
  prevSibling: hierarchyObjectBuffer.prevSibling,
  nextSibling: hierarchyObjectBuffer.nextSibling,
  hierarchyUpdated: hierarchyObjectBuffer.hierarchyUpdated,
};

export function addTransformComponent(world: World, eid: number) {
  addComponent(world, Transform, eid);
  vec3.set(Transform.position[eid], 0, 0, 0);
  vec3.set(Transform.scale[eid], 1, 1, 1);
  vec3.set(Transform.rotation[eid], 0, 0, 0);
  quat.identity(Transform.quaternion[eid]);
  mat4.identity(Transform.localMatrix[eid]);
  Transform.static[eid] = 0;
  mat4.identity(Transform.worldMatrix[eid]);
  Transform.worldMatrixNeedsUpdate[eid] = 1;
  Transform.parent[eid] = 0;
  Transform.firstChild[eid] = 0;
  Transform.nextSibling[eid] = 0;
  Transform.prevSibling[eid] = 0;
  Transform.hierarchyUpdated[eid] = 1;

  // always skip lerp for first few frames of existence
  addComponent(world, SkipRenderLerp, eid);
  Transform.skipLerp[eid] = 10;
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
  const previousParent = Transform.parent[child];
  if (previousParent !== NOOP) {
    removeChild(previousParent, child);
  }

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

export const setQuaternionFromEuler = (quaternion: quat, rotation: vec3) => {
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

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function setEulerFromTransformMatrix(rotation: vec3, matrix: mat4) {
  const order = EulerOrder[rotation[3]] || "XYZ";

  // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

  const te = matrix;

  const m11 = te[0];
  const m12 = te[4];
  const m13 = te[8];
  const m21 = te[1];
  const m22 = te[5];
  const m23 = te[9];
  const m31 = te[2];
  const m32 = te[6];
  const m33 = te[10];

  switch (order) {
    case "XYZ":
      rotation[1] = Math.asin(clamp(m13, -1, 1));

      if (Math.abs(m13) < 0.9999999) {
        rotation[0] = Math.atan2(-m23, m33);
        rotation[2] = Math.atan2(-m12, m11);
      } else {
        rotation[0] = Math.atan2(m32, m22);
        rotation[2] = 0;
      }

      break;

    case "YXZ":
      rotation[0] = Math.asin(-clamp(m23, -1, 1));

      if (Math.abs(m23) < 0.9999999) {
        rotation[1] = Math.atan2(m13, m33);
        rotation[2] = Math.atan2(m21, m22);
      } else {
        rotation[1] = Math.atan2(-m31, m11);
        rotation[2] = 0;
      }

      break;

    case "ZXY":
      rotation[0] = Math.asin(clamp(m32, -1, 1));

      if (Math.abs(m32) < 0.9999999) {
        rotation[1] = Math.atan2(-m31, m33);
        rotation[2] = Math.atan2(-m12, m22);
      } else {
        rotation[1] = 0;
        rotation[2] = Math.atan2(m21, m11);
      }

      break;

    case "ZYX":
      rotation[1] = Math.asin(-clamp(m31, -1, 1));

      if (Math.abs(m31) < 0.9999999) {
        rotation[0] = Math.atan2(m32, m33);
        rotation[2] = Math.atan2(m21, m11);
      } else {
        rotation[0] = 0;
        rotation[2] = Math.atan2(-m12, m22);
      }

      break;

    case "YZX":
      rotation[2] = Math.asin(clamp(m21, -1, 1));

      if (Math.abs(m21) < 0.9999999) {
        rotation[0] = Math.atan2(-m23, m22);
        rotation[1] = Math.atan2(-m31, m11);
      } else {
        rotation[0] = 0;
        rotation[1] = Math.atan2(m13, m33);
      }

      break;

    case "XZY":
      rotation[2] = Math.asin(-clamp(m12, -1, 1));

      if (Math.abs(m12) < 0.9999999) {
        rotation[0] = Math.atan2(m32, m22);
        rotation[1] = Math.atan2(m13, m11);
      } else {
        rotation[0] = Math.atan2(-m23, m33);
        rotation[1] = 0;
      }

      break;
  }
}

const tempMat4 = mat4.create();
const tempVec3 = vec3.create();
const tempQuat = quat.create();
const defaultUp = vec3.set(vec3.create(), 0, 1, 0);

export function setEulerFromQuaternion(rotation: Float32Array | vec3, quaternion: Float32Array | quat) {
  mat4.fromQuat(tempMat4, quaternion);
  setEulerFromTransformMatrix(rotation, tempMat4);
}

export function lookAt(eid: number, targetVec: vec3, upVec: vec3 = defaultUp) {
  updateWorldMatrix(eid, true, false);

  mat4.getTranslation(tempVec3, Transform.worldMatrix[eid]);

  mat4.lookAt(tempMat4, tempVec3, targetVec, upVec);

  const parent = Transform.parent[eid];

  mat4.getRotation(Transform.quaternion[eid], tempMat4);

  if (parent !== NOOP) {
    mat4.getRotation(tempQuat, Transform.worldMatrix[parent]);
    quat.invert(tempQuat, tempQuat);
    quat.mul(Transform.quaternion[eid], tempQuat, Transform.quaternion[eid]);
    setEulerFromQuaternion(Transform.rotation[eid], Transform.quaternion[eid]);
  } else {
    setEulerFromTransformMatrix(Transform.rotation[eid], tempMat4);
  }
}

// TODO: traverse still seems to be broken in some edge cases and needs more test cases.
// Use traverseRecursive to debug edge cases and build out proper iterative solution
export function traverse(rootEid: number, callback: (eid: number) => unknown | false) {
  // start at root
  let eid = rootEid;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const processChildren = callback(eid);

    const firstChild = Transform.firstChild[eid];

    // go downwards into children
    if (firstChild && processChildren !== false) {
      eid = firstChild;
    } else {
      // Don't traverse the root's siblings
      if (eid === rootEid) {
        return;
      }

      // go upwards if no more siblings
      while (!Transform.nextSibling[eid]) {
        // back at root
        if (eid === rootEid) {
          return;
        }

        // go upwards
        eid = Transform.parent[eid];
      }

      // go sideways
      eid = Transform.nextSibling[eid];
    }
  }
}

export function traverseRecursive(eid: number, callback: (eid: number) => unknown | false) {
  if (eid) {
    const processChildren = callback(eid);

    if (processChildren === false) return;
  }

  let curChild = Transform.firstChild[eid];

  while (curChild) {
    traverseRecursive(curChild, callback);
    curChild = Transform.nextSibling[curChild];
  }
}

export function traverseReverse(rootEid: number, callback: (eid: number) => unknown) {
  const stack: number[] = [];
  traverse(rootEid, (eid) => {
    stack.push(eid);
  });

  while (stack.length) {
    callback(stack.pop()!);
  }
}

export function traverseReverseRecursive(eid: number, callback: (eid: number) => unknown) {
  let curChild = getLastChild(eid);

  while (curChild) {
    traverseReverseRecursive(curChild, callback);
    curChild = Transform.prevSibling[curChild];
  }

  if (eid) {
    callback(eid);
  }
}

export function removeRecursive(world: World, rootEid: number) {
  if (!entityExists(world, rootEid)) {
    return;
  }

  traverseReverseRecursive(rootEid, (eid) => {
    // TODO: removeEntity should reset components
    const components = getEntityComponents(world, eid);

    for (let i = 0; i < components.length; i++) {
      if (components[i] === Networked || components[i] === RigidBody) {
        removeComponent(world, components[i], eid, false);
      } else {
        removeComponent(world, components[i], eid, true);
      }
    }

    removeEntity(world, eid);
  });

  if (Transform.parent[rootEid]) {
    removeChild(Transform.parent[rootEid], rootEid);
  } else {
    Transform.firstChild[rootEid] = NOOP;
    Transform.prevSibling[rootEid] = NOOP;
    Transform.nextSibling[rootEid] = NOOP;
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

export function getDirection(out: vec3, matrix: mat4): vec3 {
  vec3.set(out, matrix[8], matrix[9], matrix[10]);
  return vec3.normalize(out, out);
}

export function UpdateMatrixWorldSystem(ctx: GameState) {
  updateMatrixWorld(ctx.activeScene);
}

/*
notes on calculating forward/up/right:

  forward.x =  cos(pitch) * sin(yaw);
  forward.y = -sin(pitch);
  forward.z =  cos(pitch) * cos(yaw);

  right.x =  cos(yaw);
  right.y =  0;
  right.z = -sin(yaw);

  up = cross(forward, right);

  equivalent:
  up.x = sin(pitch) * sin(yaw);
  up.y = cos(pitch);
  up.z = sin(pitch) * cos(yaw);
*/
export const getPitch = ([x, y, z, w]: quat) => Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * x * x - 2 * z * z);
export const getRoll = ([x, y, z, w]: quat) => Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * y * y - 2 * z * z);
export const getYaw = ([x, y, z, w]: quat) => Math.asin(2 * x * y + 2 * z * w);

// TODO: figure out why roll is yaw and algo is inverted
/*
correct algo:
const x = Math.cos(pitch) * Math.sin(yaw);
const y = -Math.sin(pitch);
const z = Math.cos(pitch) * Math.cos(yaw);
*/
export function getForwardVector(out: vec3, pitch: number, roll: number) {
  return vec3.set(out, -Math.cos(pitch) * Math.sin(roll), Math.sin(pitch), -Math.cos(pitch) * Math.cos(roll));
}

export function getRightVector(out: vec3, roll: number) {
  return vec3.set(out, Math.cos(roll), 0, -Math.sin(roll));
}

export const SkipRenderLerp = defineComponent();
const skipRenderLerpQuery = defineQuery([SkipRenderLerp]);

export function SkipRenderLerpSystem(ctx: GameState) {
  const ents = skipRenderLerpQuery(ctx.world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];

    Transform.skipLerp[eid] = Transform.skipLerp[eid] - 1;

    if (Transform.skipLerp[eid] <= 0) {
      Transform.skipLerp[eid] = 0;
      removeComponent(ctx.world, SkipRenderLerp, eid);
    }
  }
}

/**
 * Prevents the renderer from lerping an entity's position for N frames.
 * Useful in cases where an entity is teleported. Entity won't zip to the new location and instead will disappear and reappear instantaneously.
 *
 * @param ctx
 * @param eid
 * @param numberOfFramesToSkip
 */
export function skipRenderLerp(ctx: GameState, eid: number, numberOfFramesToSkip = 10) {
  addComponent(ctx.world, SkipRenderLerp, eid);
  Transform.skipLerp[eid] = numberOfFramesToSkip;
}
