import { defineQuery, entityExists, getEntityComponents, removeComponent, removeEntity } from "bitecs";
import { vec3, quat, mat4 } from "gl-matrix";

import { GameState } from "../GameTypes";
import { Networked } from "../network/network.game";
import { RigidBody } from "../physics/physics.game";
import { ResourceType } from "../resource/schema";
import { addResourceRef, RemoteNode, RemoteScene, removeResourceRef } from "../resource/resource.game";
import { RemoteNodeComponent } from "../node/node.game";

export const Axes = {
  X: vec3.fromValues(1, 0, 0),
  Y: vec3.fromValues(0, 1, 0),
  Z: vec3.fromValues(0, 0, 1),
};

export function getLastChild(parent: RemoteNode | RemoteScene): RemoteNode | undefined {
  let cursor = parent.resourceType === ResourceType.Node ? parent.firstChild : parent.firstNode;

  let last = cursor;

  while (cursor) {
    last = cursor;
    cursor = cursor.nextSibling;
  }

  return last;
}

export function getChildAt(parent: RemoteNode | RemoteScene, index: number): RemoteNode | undefined {
  let cursor = parent.resourceType === ResourceType.Node ? parent.firstChild : parent.firstNode;

  if (cursor) {
    for (let i = 1; i <= index; i++) {
      cursor = cursor.nextSibling;

      if (!cursor) {
        return undefined;
      }
    }
  }

  return cursor;
}

export const findChild = (parent: RemoteNode | RemoteScene, predicate: (node: RemoteNode) => boolean) => {
  let result: RemoteNode | undefined;
  traverse(parent, (child) => {
    if (predicate(child)) {
      result = child;
      return false;
    }
  });
  return result;
};

export function addChild(ctx: GameState, parent: RemoteNode | RemoteScene, child: RemoteNode) {
  addResourceRef(ctx, child.resourceId);

  const previousParent = child.parent || child.parentScene;

  if (previousParent) {
    removeChild(ctx, previousParent, child);
  }

  if (parent.resourceType === ResourceType.Node) {
    child.parent = parent;
  } else {
    child.parentScene = parent;
  }

  const lastChild = getLastChild(parent);

  if (lastChild) {
    lastChild.nextSibling = child;
    child.prevSibling = lastChild;
    child.nextSibling = undefined;
  } else {
    if (parent.resourceType === ResourceType.Node) {
      parent.firstChild = child;
    } else {
      parent.firstNode = child;
    }

    child.prevSibling = undefined;
    child.nextSibling = undefined;
  }

  removeResourceRef(ctx, child.resourceId);
}

export function removeChild(ctx: GameState, parent: RemoteNode | RemoteScene, child: RemoteNode) {
  addResourceRef(ctx, child.resourceId);

  const prevSibling = child.prevSibling;
  const nextSibling = child.nextSibling;

  if (parent.resourceType === ResourceType.Node) {
    if (parent.firstChild === child) {
      parent.firstChild = undefined;
    }
  } else {
    if (parent.firstNode === child) {
      parent.firstNode = undefined;
    }
  }

  // [prev, child, next]
  if (prevSibling && nextSibling) {
    prevSibling.nextSibling = nextSibling;
    nextSibling.prevSibling = prevSibling;
  }
  // [prev, child]
  if (prevSibling && !nextSibling) {
    prevSibling.nextSibling = undefined;
  }
  // [child, next]
  if (nextSibling && !prevSibling) {
    nextSibling.prevSibling = undefined;

    if (parent.resourceType === ResourceType.Node) {
      parent.firstChild = nextSibling;
    } else {
      parent.firstNode = nextSibling;
    }
  }

  child.parentScene = undefined;
  child.parent = undefined;
  child.nextSibling = undefined;
  child.prevSibling = undefined;

  removeResourceRef(ctx, child.resourceId);
}

export const updateWorldMatrix = (node: RemoteNode | RemoteScene, updateParents: boolean, updateChildren: boolean) => {
  if (node.resourceType === ResourceType.Node) {
    const parent = node.parent;

    if (updateParents === true && parent) {
      updateWorldMatrix(parent, true, false);
    }

    if (!node.isStatic) updateMatrix(node);

    if (parent) {
      node.worldMatrix.set(node.localMatrix);
    } else {
      mat4.multiply(node.worldMatrix, node.worldMatrix, node.localMatrix);
    }
  }

  // update children
  if (updateChildren) {
    let nextChild = node.resourceType === ResourceType.Node ? node.firstChild : node.firstNode;
    while (nextChild) {
      updateWorldMatrix(nextChild, false, true);
      nextChild = nextChild.nextSibling;
    }
  }
};

export const updateMatrixWorld = (node: RemoteNode | RemoteScene, force = false) => {
  if (node.resourceType === ResourceType.Node) {
    if (!node.isStatic) updateMatrix(node);

    if (node.worldMatrixNeedsUpdate || force) {
      const parent = node.parent;
      if (parent) {
        mat4.multiply(node.worldMatrix, parent.worldMatrix, node.localMatrix);
      } else {
        node.worldMatrix.set(node.localMatrix);
      }
      // Transform.worldMatrixNeedsUpdate[eid] = 0;
      force = true;
    }
  }

  let nextChild = node.resourceType === ResourceType.Node ? node.firstChild : node.firstNode;
  while (nextChild) {
    updateMatrixWorld(nextChild, force);
    nextChild = nextChild.nextSibling;
  }
};

export const updateMatrix = (node: RemoteNode) => {
  mat4.fromRotationTranslationScale(node.localMatrix, node.quaternion, node.position, node.scale);
  node.worldMatrixNeedsUpdate = true;
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
const tempEuler = vec3.create();
const tempQuat = quat.create();
const defaultUp = vec3.set(vec3.create(), 0, 1, 0);

export function setEulerFromQuaternion(rotation: Float32Array | vec3, quaternion: Float32Array | quat) {
  mat4.fromQuat(tempMat4, quaternion);
  setEulerFromTransformMatrix(rotation, tempMat4);
}

const RAD2DEG = 180 / Math.PI;

export function isolateQuaternionAxis(quaternion: quat, axis: vec3) {
  setEulerFromQuaternion(tempEuler, quaternion);
  vec3.mul(tempVec3, tempEuler, axis);
  quat.fromEuler(quaternion, tempVec3[0] * RAD2DEG, tempVec3[1] * RAD2DEG, tempVec3[2] * RAD2DEG);
}

export function lookAt(node: RemoteNode, targetVec: vec3, upVec: vec3 = defaultUp) {
  updateWorldMatrix(node, true, false);

  mat4.getTranslation(tempVec3, node.worldMatrix);

  mat4.lookAt(tempMat4, tempVec3, targetVec, upVec);

  const parent = node.parent;

  mat4.getRotation(node.quaternion, tempMat4);

  if (parent) {
    mat4.getRotation(tempQuat, parent.worldMatrix);
    quat.invert(tempQuat, tempQuat);
    quat.mul(node.quaternion, tempQuat, node.quaternion);
  }
}

export function traverse(node: RemoteNode | RemoteScene, callback: (child: RemoteNode) => unknown | false) {
  let curChild;

  if (node.resourceType === ResourceType.Node) {
    const processChildren = callback(node);

    if (processChildren === false) return;

    curChild = node.firstChild;
  } else {
    curChild = node.firstNode;
  }

  while (curChild) {
    traverse(curChild, callback);
    curChild = curChild.nextSibling;
  }
}

export function traverseReverse(node: RemoteNode | RemoteScene, callback: (node: RemoteNode) => unknown) {
  let curChild = getLastChild(node);

  while (curChild) {
    traverseReverse(curChild, callback);
    curChild = curChild.prevSibling;
  }

  if (node && node.resourceType == ResourceType.Node) {
    callback(node);
  }
}

export function removeNode(ctx: GameState, node: RemoteNode | RemoteScene) {
  const world = ctx.world;

  if (!entityExists(world, node.eid)) {
    return;
  }

  traverseReverse(node, (child) => {
    const eid = child.eid;
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

  if (node.resourceType === ResourceType.Scene) {
    removeEntity(world, node.eid);
  } else {
    const parent = node.parent || node.parentScene;

    if (parent) {
      removeChild(ctx, parent, node);
    } else {
      node.firstChild = undefined;
      node.prevSibling = undefined;
      node.nextSibling = undefined;
    }
  }
}

export function* getChildren(node: RemoteNode | RemoteScene): Generator<RemoteNode, undefined> {
  let cursor = node.resourceType === ResourceType.Node ? node.firstChild : node.firstNode;

  while (cursor) {
    yield cursor;
    cursor = cursor.nextSibling;
  }

  return undefined;
}

export function getDirection(out: vec3, matrix: mat4): vec3 {
  vec3.set(out, matrix[8], matrix[9], matrix[10]);
  return vec3.normalize(out, out);
}

export function UpdateMatrixWorldSystem(ctx: GameState) {
  if (ctx.activeScene) {
    updateMatrixWorld(ctx.activeScene);
  }
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

const skipRenderLerpQuery = defineQuery([RemoteNodeComponent]);

export function SkipRenderLerpSystem(ctx: GameState) {
  const ents = skipRenderLerpQuery(ctx.world);

  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const node = RemoteNodeComponent.get(eid)!;

    node.skipLerp -= 1;

    if (node.skipLerp <= 0) {
      node.skipLerp = 0;
    }
  }
}
