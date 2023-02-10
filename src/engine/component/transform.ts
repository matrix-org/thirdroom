import { vec3, quat, mat4 } from "gl-matrix";

import { GameState } from "../GameTypes";
import { ResourceType } from "../resource/schema";
import { RemoteNode, RemoteScene } from "../resource/RemoteResources";
import { defaultUp, tempVec3, tempMat4, tempQuat } from "./math";

export function getLastChild(parent: RemoteNode | RemoteScene): RemoteNode | undefined {
  let cursor = parent.resourceType === ResourceType.Node ? parent.firstChild : parent.firstNode;

  let last = cursor;

  while (cursor) {
    last = cursor;
    cursor = cursor.nextSibling;
  }

  return last;
}

export function getLastSibling(node: RemoteNode): RemoteNode {
  let cursor: RemoteNode | undefined = node;

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

function removeNodeFromLinkedList(parent: RemoteNode | RemoteScene, child: RemoteNode) {
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
}

export function addChild(parent: RemoteNode | RemoteScene, child: RemoteNode) {
  child.addRef();
  const previousParent = child.parent || child.parentScene;

  if (parent.resourceType === ResourceType.Node) {
    child.parent = parent;
  } else {
    child.parentScene = parent;
  }

  if (previousParent) {
    removeNodeFromLinkedList(previousParent, child);
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
  child.removeRef();
}

export function removeChild(parent: RemoteNode | RemoteScene, child: RemoteNode) {
  child.addRef();
  removeNodeFromLinkedList(parent, child);
  child.parentScene = undefined;
  child.parent = undefined;
  child.prevSibling = undefined;
  child.nextSibling = undefined;
  child.firstChild = undefined;
  child.removeRef();
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

export const updateMatrixWorld = (node: RemoteScene | RemoteNode, force = false) => {
  if (node.resourceType === ResourceType.Node) {
    if (node.isStatic) {
      return;
    }

    updateMatrix(node);

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

export function setFromLocalMatrix(node: RemoteNode, localMatrix: mat4) {
  node.localMatrix.set(localMatrix);
  mat4.getTranslation(node.position, localMatrix);
  mat4.getRotation(node.quaternion, localMatrix);
  mat4.getScaling(node.scale, localMatrix);
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

export function* getChildren(node: RemoteNode | RemoteScene): Generator<RemoteNode, undefined> {
  let cursor = node.resourceType === ResourceType.Node ? node.firstChild : node.firstNode;

  while (cursor) {
    yield cursor;
    cursor = cursor.nextSibling;
  }

  return undefined;
}

export function UpdateMatrixWorldSystem(ctx: GameState) {
  if (ctx.worldResource.environment) {
    updateMatrixWorld(ctx.worldResource.environment.privateScene);
    updateMatrixWorld(ctx.worldResource.environment.publicScene);
  }

  let nextNode = ctx.worldResource.firstNode;

  while (nextNode) {
    updateMatrixWorld(nextNode);
    nextNode = nextNode.nextSibling;
  }

  updateMatrixWorld(ctx.worldResource.persistentScene);
}
