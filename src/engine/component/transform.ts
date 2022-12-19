import { addComponent, defineComponent, defineQuery, getEntityComponents, removeComponent, removeEntity } from "bitecs";
import { vec3, quat, mat4 } from "gl-matrix";

import { NOOP } from "../config.common";
import { GameState, World } from "../GameTypes";
import { Networked } from "../network/network.game";
import { RigidBody } from "../physics/physics.game";
import { RemoteNodeComponent } from "../node/node.game";
import { RemoteNode, RemoteScene, ResourceType } from "../resource/schema";

export function getLastChild(parent: RemoteNode | RemoteScene): RemoteNode | undefined {
  let cursor: RemoteNode | undefined;

  if (parent.resourceType === ResourceType.Node) {
    cursor = parent as RemoteNode;
  } else {
    const scene = parent as RemoteScene;
    cursor = scene.firstNode as RemoteNode | undefined;
  }

  let last = cursor;

  while (cursor) {
    last = cursor;
    cursor = cursor.nextSibling as RemoteNode | undefined;
  }

  return last as RemoteNode | undefined;
}

export function getChildAt(node: RemoteNode, index: number): RemoteNode | undefined {
  let cursor = node.firstChild;

  if (cursor) {
    for (let i = 1; i <= index; i++) {
      cursor = cursor.nextSibling;

      if (!cursor) {
        return undefined;
      }
    }
  }

  return cursor as RemoteNode | undefined;
}

export const findChild = (
  parent: RemoteNode | RemoteScene,
  predicate: (node: RemoteNode) => boolean
): RemoteNode | undefined => {
  let cur;
  traverseRecursive(parent, (e) => {
    if (predicate(e)) {
      cur = e;
      return false;
    }
  });
  return cur;
};

export function addChild(parent: RemoteNode | RemoteScene, child: RemoteNode) {
  const previousParent = (child.parent || child.parentScene) as RemoteNode | RemoteScene | undefined;

  if (previousParent) {
    removeChild(previousParent, child);
  }

  if (parent.resourceType === ResourceType.Node) {
    child.parent = parent as RemoteNode;
  } else {
    child.parentScene = parent as RemoteScene;
  }

  const lastChild = getLastChild(parent);

  if (lastChild) {
    lastChild.nextSibling = child;
    child.prevSibling = lastChild;
    child.nextSibling = undefined;
  } else {
    if (parent.resourceType === ResourceType.Node) {
      (parent as RemoteNode).firstChild = child;
    } else {
      (parent as RemoteScene).firstNode = child;
    }

    child.prevSibling = undefined;
    child.nextSibling = undefined;
  }
}

export function removeChild(parent: RemoteNode | RemoteScene, child: RemoteNode) {
  const prevSibling = child.prevSibling;
  const nextSibling = child.nextSibling;

  if (parent.resourceType === ResourceType.Node) {
    const parentNode = parent as RemoteNode;

    if (parentNode.firstChild === child) {
      parentNode.firstChild = undefined;
    }
  } else {
    const parentScene = parent as RemoteScene;

    if (parentScene.firstNode === child) {
      parentScene.firstNode = undefined;
    }
  }

  // [prev, child, next]
  if (prevSibling && nextSibling) {
    prevSibling.nextSibling = nextSibling;
    nextSibling.prevSibling = prevSibling;
  }
  // [prev, child]
  if (prevSibling && nextSibling) {
    prevSibling.nextSibling = undefined;
  }
  // [child, next]
  if (nextSibling && prevSibling) {
    nextSibling.prevSibling = undefined;

    if (parent.resourceType === ResourceType.Node) {
      const parentNode = parent as RemoteNode;
      parentNode.firstChild = nextSibling;
    } else {
      const parentScene = parent as RemoteScene;
      parentScene.firstNode = nextSibling;
    }
  }

  child.parentScene = undefined;
  child.parent = undefined;
  child.nextSibling = undefined;
  child.prevSibling = undefined;
}

export const updateWorldMatrix = (
  nodeOrScene: RemoteNode | RemoteScene,
  updateParents: boolean,
  updateChildren: boolean
) => {
  if (nodeOrScene.resourceType === ResourceType.Node) {
    const node = nodeOrScene as RemoteNode;

    const parent = node.parent;

    if (updateParents === true && parent) {
      updateWorldMatrix(parent as RemoteNode, true, false);
    }

    if (!node.isStatic) updateMatrix(node);

    if (!parent) {
      node.worldMatrix.set(node.localMatrix);
    } else {
      mat4.multiply(node.worldMatrix, parent.worldMatrix, node.localMatrix);
    }
  }

  // update children
  if (updateChildren) {
    let nextChild: RemoteNode | undefined;

    if (nodeOrScene.resourceType === ResourceType.Node) {
      nextChild = (nodeOrScene as RemoteNode).firstChild as RemoteNode | undefined;
    } else {
      nextChild = (nodeOrScene as RemoteScene).firstNode as RemoteNode | undefined;
    }

    while (nextChild) {
      updateWorldMatrix(nextChild, false, true);
      nextChild = nextChild.nextSibling as RemoteNode | undefined;
    }
  }
};

export const updateMatrixWorld = (nodeOrScene: RemoteNode | RemoteScene, force = false) => {
  let nextChild: RemoteNode | undefined;

  if (nodeOrScene.resourceType === ResourceType.Node) {
    const node = nodeOrScene as RemoteNode;

    if (!node.isStatic) updateMatrix(node);

    if (node.worldMatrixNeedsUpdate || force) {
      const parent = node.parent;
      if (!parent) {
        node.worldMatrix.set(node.localMatrix);
      } else {
        mat4.multiply(node.worldMatrix, parent.worldMatrix, node.localMatrix);
      }
      // Transform.worldMatrixNeedsUpdate[eid] = 0;
      force = true;
    }
  } else {
    const scene = nodeOrScene as RemoteScene;
    nextChild = scene.firstNode as RemoteNode | undefined;
  }

  while (nextChild) {
    updateMatrixWorld(nextChild, force);
    nextChild = nextChild.nextSibling as RemoteNode | undefined;
  }
};

export const updateMatrix = (node: RemoteNode) => {
  const position = node.position;
  const quaternion = node.quaternion;
  const scale = node.scale;
  mat4.fromRotationTranslationScale(node.localMatrix, quaternion, position, scale);
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

const tempMat4 = mat4.create();
const tempVec3 = vec3.create();
const tempQuat = quat.create();
const defaultUp = vec3.set(vec3.create(), 0, 1, 0);

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

export function traverseRecursive(
  nodeOrScene: RemoteNode | RemoteScene,
  callback: (node: RemoteNode) => unknown | false
) {
  let curChild: RemoteNode | undefined;

  if (nodeOrScene.resourceType === ResourceType.Node) {
    const node = nodeOrScene as RemoteNode;
    const processChildren = callback(node);

    if (processChildren === false) return;

    curChild = node.firstChild as RemoteNode | undefined;
  } else {
    const scene = nodeOrScene as RemoteScene;
    curChild = scene.firstNode as RemoteNode | undefined;
  }

  while (curChild) {
    traverseRecursive(curChild, callback);
    curChild = curChild.nextSibling as RemoteNode | undefined;
  }
}

export function traverseReverseRecursive(
  nodeOrScene: RemoteNode | RemoteScene,
  callback: (node: RemoteNode) => unknown
) {
  let curChild = getLastChild(nodeOrScene);

  while (curChild) {
    traverseReverseRecursive(curChild, callback);
    curChild = curChild.prevSibling as RemoteNode | undefined;
  }

  if (nodeOrScene.resourceType === ResourceType.Node) {
    callback(nodeOrScene as RemoteNode);
  }
}

export function removeRecursive(world: World, rootNodeOrScene: RemoteNode | RemoteScene) {
  traverseReverseRecursive(rootNodeOrScene, (node) => {
    const eid = node.resourceId;

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

  if (rootNodeOrScene.resourceType === ResourceType.Node) {
    const rootNode = rootNodeOrScene as RemoteNode;
    const parent = rootNode.parent as RemoteNode | undefined;

    if (parent) {
      removeChild(parent, rootNode);
    } else {
      rootNode.firstChild = undefined;
      rootNode.prevSibling = undefined;
      rootNode.nextSibling = undefined;
    }
  } else {
    const rootScene = rootNodeOrScene as RemoteScene;
    rootScene.firstNode = undefined;
  }
}

export function* getChildren(
  parentNodeOrScene: RemoteNode | RemoteScene
): Generator<RemoteNode | undefined, RemoteNode | undefined> {
  let cursor: RemoteNode | undefined;

  if (parentNodeOrScene.resourceType === ResourceType.Node) {
    const parentNode = parentNodeOrScene as RemoteNode;
    cursor = parentNode.firstChild as RemoteNode | undefined;
  } else {
    const parentScene = parentNodeOrScene as RemoteScene;
    cursor = parentScene.firstNode as RemoteNode | undefined;
  }

  while (cursor) {
    yield cursor;
    cursor = cursor.nextSibling as RemoteNode | undefined;
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

export const SkipRenderLerp = defineComponent();
const skipRenderLerpQuery = defineQuery([SkipRenderLerp]);

export function SkipRenderLerpSystem(ctx: GameState) {
  const ents = skipRenderLerpQuery(ctx.world);

  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];

    const remoteNode = RemoteNodeComponent.get(eid);

    if (!remoteNode) {
      continue;
    }

    remoteNode.skipLerp = remoteNode.skipLerp - 1;

    if (remoteNode.skipLerp <= 0) {
      remoteNode.skipLerp = 0;
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
  const remoteNode = RemoteNodeComponent.get(eid);

  if (!remoteNode) {
    return NOOP;
  }

  addComponent(ctx.world, SkipRenderLerp, eid);
  remoteNode.skipLerp = numberOfFramesToSkip;
}
