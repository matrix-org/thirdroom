import RAPIER, { ColliderDesc } from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";
import { mat4, quat, vec3 } from "gl-matrix";

import { vec3ArrayTransformMat4, getAccessorArrayView } from "../accessor/accessor.common";
import { addChild } from "../component/transform";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { addRemoteNodeComponent } from "../node/node.game";
import { staticRigidBodyCollisionGroups } from "../physics/CollisionGroups";
import { addRigidBody, PhysicsModule } from "../physics/physics.game";
import { RemoteAccessor, RemoteMesh, RemoteNode } from "../resource/resource.game";
import { MeshPrimitiveAttributeIndex } from "../resource/schema";
import { GLTFNode, GLTFRoot } from "./GLTF";
import { GLTFResource, loadGLTFMesh } from "./gltf.game";

export function hasColliderExtension(root: GLTFRoot): boolean {
  return !!(root.extensionsUsed && root.extensionsUsed.includes("OMI_collider"));
}

export function hasMeshCollider(root: GLTFRoot, node: GLTFNode): boolean {
  const colliderIndex = node.extensions?.OMI_collider?.collider;

  if (!root.extensions?.OMI_collider?.colliders || colliderIndex === undefined) {
    return false;
  }

  const colliderDef = root.extensions.OMI_collider.colliders[colliderIndex];

  return colliderDef !== undefined && colliderDef.type === "mesh";
}

export async function loadColliderMesh(
  ctx: GameState,
  resource: GLTFResource,
  root: GLTFRoot,
  node: GLTFNode
): Promise<RemoteMesh | undefined> {
  const colliderIndex = node.extensions?.OMI_collider?.collider;

  if (colliderIndex === undefined) {
    return undefined;
  }

  const colliders = root.extensions?.OMI_collider?.colliders;

  if (!colliders) {
    return undefined;
  }

  const collider = colliders[colliderIndex];

  if (!collider || collider.type !== "mesh" || collider.mesh === undefined) {
    return undefined;
  }

  return loadGLTFMesh(ctx, resource, collider.mesh);
}

export function nodeHasCollider(node: GLTFNode): boolean {
  return node.extensions?.OMI_collider !== undefined;
}

const tempPosition = vec3.create();
const tempRotation = quat.create();
const tempScale = vec3.create();

export function addCollider(
  ctx: GameState,
  resource: GLTFResource,
  node: GLTFNode,
  remoteNode: RemoteNode,
  colliderMesh?: RemoteMesh
) {
  const colliderIndex = node.extensions?.OMI_collider?.collider;

  if (colliderIndex === undefined) {
    console.warn(`No collider on node "${remoteNode.name}"`);
    return;
  }

  const colliders = resource.root.extensions?.OMI_collider?.colliders;

  if (!colliders) {
    return;
  }

  const collider = colliders[colliderIndex];

  if (!collider) {
    console.warn(`Collider "${colliderIndex}" not found.`);
  }

  const physics = getModule(ctx, PhysicsModule);
  const { physicsWorld } = physics;

  let colliderDesc: ColliderDesc;

  if (collider.type === "box") {
    if (!collider.extents) {
      console.warn(`Ignoring box collider ${colliderIndex} without extents property`);
      return;
    }

    vec3.mul(tempScale, tempScale, collider.extents as vec3);
    colliderDesc = RAPIER.ColliderDesc.cuboid(tempScale[0], tempScale[1], tempScale[2]);
  } else if (collider.type === "sphere") {
    if (collider.radius === undefined) {
      console.warn(`Ignoring sphere collider ${colliderIndex} without radius property`);
      return;
    }

    colliderDesc = RAPIER.ColliderDesc.ball(collider.radius * tempScale[0]);
  } else if (collider.type === "capsule") {
    if (collider.radius === undefined) {
      console.warn(`Ignoring capsule collider ${colliderIndex} without radius property`);
      return;
    }

    if (collider.height === undefined) {
      console.warn(`Ignoring capsule collider ${colliderIndex} without height property`);
      return;
    }

    colliderDesc = RAPIER.ColliderDesc.capsule((collider.height / 2) * tempScale[0], collider.radius * tempScale[0]);
  } else if (collider.type === "mesh") {
    if (!colliderMesh) {
      console.warn(`Ignoring mesh collider ${colliderIndex} without mesh.`);
      return;
    }

    addTrimeshFromMesh(ctx, remoteNode, colliderMesh);

    return;
  } else {
    console.warn(`Unsupported collider type ${collider.type}`);
    return;
  }

  const worldMatrix = remoteNode.worldMatrix;
  mat4.getTranslation(tempPosition, worldMatrix);
  mat4.getRotation(tempRotation, worldMatrix);
  mat4.getScaling(tempScale, worldMatrix);

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newStatic();
  rigidBodyDesc.setTranslation(tempPosition[0], tempPosition[1], tempPosition[2]);
  rigidBodyDesc.setRotation(new RAPIER.Quaternion(tempRotation[0], tempRotation[1], tempRotation[2], tempRotation[3]));
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  colliderDesc.setCollisionGroups(staticRigidBodyCollisionGroups);
  physicsWorld.createCollider(colliderDesc, rigidBody.handle);

  addRigidBody(ctx, remoteNode, rigidBody);
}

export function addTrimeshFromMesh(ctx: GameState, node: RemoteNode, mesh: RemoteMesh) {
  const { physicsWorld } = getModule(ctx, PhysicsModule);

  // TODO: We don't really need the whole RemoteMesh just for a trimesh and tracking
  // the resource is expensive.

  for (const primitive of mesh.primitives) {
    const rigidBodyDesc = RAPIER.RigidBodyDesc.newStatic();
    const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

    const positionsArray = getAccessorArrayView(
      primitive.attributes[MeshPrimitiveAttributeIndex.POSITION] as RemoteAccessor
    ).slice() as Float32Array;
    vec3ArrayTransformMat4(positionsArray, positionsArray, node.worldMatrix);

    let indicesArr: Uint32Array;

    if (primitive.indices) {
      const indicesArrView = getAccessorArrayView(primitive.indices as RemoteAccessor);
      indicesArr = indicesArrView instanceof Uint32Array ? indicesArrView : new Uint32Array(indicesArrView);
    } else {
      indicesArr = new Uint32Array(positionsArray.length / 3);

      for (let i = 0; i < indicesArr.length; i++) {
        indicesArr[i] = i;
      }
    }

    const colliderDesc = RAPIER.ColliderDesc.trimesh(positionsArray, indicesArr);

    colliderDesc.setCollisionGroups(staticRigidBodyCollisionGroups);

    physicsWorld.createCollider(colliderDesc, rigidBody.handle);

    const primitiveEid = addEntity(ctx.world);
    const primitiveNode = addRemoteNodeComponent(ctx, primitiveEid);
    addChild(node, primitiveNode);
    addRigidBody(ctx, primitiveNode, rigidBody, mesh, primitive);
  }
}
