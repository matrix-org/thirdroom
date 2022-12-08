import RAPIER, { ColliderDesc } from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";
import { mat4, quat, vec3 } from "gl-matrix";

import { vec3ArrayTransformMat4, getAccessorArrayView } from "../accessor/accessor.common";
import { addTransformComponent, addChild, Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { RemoteMesh } from "../mesh/mesh.game";
import { getModule } from "../module/module.common";
import { RemoteNodeComponent } from "../node/node.game";
import { staticRigidBodyCollisionGroups } from "../physics/CollisionGroups";
import { addRigidBody, PhysicsModule } from "../physics/physics.game";
import { GLTFNode, GLTFRoot } from "./GLTF";
import { GLTFResource } from "./gltf.game";

export function hasColliderExtension(root: GLTFRoot): boolean {
  return !!(root.extensionsUsed && root.extensionsUsed.includes("OMI_collider"));
}

export function hasMeshCollider(root: GLTFRoot, node: GLTFNode): boolean {
  if (!nodeHasCollider(node)) {
    return false;
  }

  const colliderDef = root.extensions?.OMI_collider.colliders[node.extensions?.OMI_collider.collider];

  return colliderDef !== undefined && colliderDef.type === "mesh";
}

export function getColliderMesh(root: GLTFRoot, node: GLTFNode): number {
  return root.extensions!.OMI_collider.colliders[node.extensions!.OMI_collider.collider].mesh;
}

export function nodeHasCollider(node: GLTFNode): boolean {
  return node.extensions?.OMI_collider !== undefined;
}

const tempPosition = vec3.create();
const tempRotation = quat.create();
const tempScale = vec3.create();

const supportedColliders = ["mesh", "box", "sphere", "capsule"];

export function addCollider(
  ctx: GameState,
  resource: GLTFResource,
  node: GLTFNode,
  nodeEid: number,
  colliderMesh?: RemoteMesh
) {
  const index = node.extensions!.OMI_collider.collider;
  const collider = resource.root.extensions!.OMI_collider.colliders[index];
  const physics = getModule(ctx, PhysicsModule);
  const { physicsWorld } = physics;

  if (!supportedColliders.includes(collider.type)) {
    console.warn(`Unsupported collider type ${collider.type}`);
    return;
  }

  if (collider.type === "mesh" && colliderMesh) {
    addTrimeshFromMesh(ctx, nodeEid, colliderMesh);
    return;
  }

  const worldMatrix = Transform.worldMatrix[nodeEid];
  mat4.getTranslation(tempPosition, worldMatrix);
  mat4.getRotation(tempRotation, worldMatrix);
  mat4.getScaling(tempScale, worldMatrix);

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newStatic();
  rigidBodyDesc.setTranslation(tempPosition[0], tempPosition[1], tempPosition[2]);
  rigidBodyDesc.setRotation(new RAPIER.Quaternion(tempRotation[0], tempRotation[1], tempRotation[2], tempRotation[3]));
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  let colliderDesc: ColliderDesc;

  if (collider.type === "box") {
    vec3.mul(tempScale, tempScale, collider.extents);
    colliderDesc = RAPIER.ColliderDesc.cuboid(tempScale[0], tempScale[1], tempScale[2]);
  } else if (collider.type === "sphere") {
    colliderDesc = RAPIER.ColliderDesc.ball(collider.radius * tempScale[0]);
  } else {
    colliderDesc = RAPIER.ColliderDesc.capsule((collider.height / 2) * tempScale[0], collider.radius * tempScale[0]);
  }

  colliderDesc.setCollisionGroups(staticRigidBodyCollisionGroups);
  physicsWorld.createCollider(colliderDesc, rigidBody.handle);

  addRigidBody(ctx, nodeEid, rigidBody);
}

export function addTrimesh(ctx: GameState, nodeEid: number) {
  const remoteNode = RemoteNodeComponent.get(nodeEid);

  if (!remoteNode || !remoteNode.mesh) {
    return;
  }

  addTrimeshFromMesh(ctx, nodeEid, remoteNode.mesh);
}

export function addTrimeshFromMesh(ctx: GameState, nodeEid: number, mesh: RemoteMesh) {
  const { physicsWorld } = getModule(ctx, PhysicsModule);

  // TODO: We don't really need the whole RemoteMesh just for a trimesh and tracking
  // the resource is expensive.

  for (const primitive of mesh.primitives) {
    const rigidBodyDesc = RAPIER.RigidBodyDesc.newStatic();
    const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

    const positionsArray = getAccessorArrayView(primitive.attributes.POSITION).slice() as Float32Array;
    vec3ArrayTransformMat4(positionsArray, positionsArray, Transform.worldMatrix[nodeEid]);

    let indicesArr: Uint32Array;

    if (primitive.indices) {
      const indicesArrView = getAccessorArrayView(primitive.indices);
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
    addTransformComponent(ctx.world, primitiveEid);
    addChild(nodeEid, primitiveEid);
    addRigidBody(ctx, primitiveEid, rigidBody, mesh.resourceId, primitive.resourceId);
  }
}
