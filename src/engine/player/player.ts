import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent } from "bitecs";
import { quat } from "gl-matrix";

import { AVATAR_CAPSULE_HEIGHT, AVATAR_CAPSULE_RADIUS } from "../../plugins/avatars/common";
import { AvatarRef } from "../../plugins/avatars/components";
import { CursorView, writeFloat32, readFloat32 } from "../allocator/CursorView";
import { getCamera } from "../camera/camera.game";
import { addChild } from "../component/transform";
import { GameState } from "../GameTypes";
import { createNodeFromGLTFURI } from "../gltf/gltf.game";
import { defineReplicator } from "../network/NetworkReplicator";
import { defineNetworkSynchronizer } from "../network/NetworkSynchronizer";
import { playerCollisionGroups } from "../physics/CollisionGroups";
import { RigidBody, addNodePhysicsBody } from "../physics/physics.game";
import { RemoteCollider, RemoteNode, RemotePhysicsBody } from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { ColliderType, PhysicsBodyType } from "../resource/schema";

export function definePlayerReplicator(ctx: GameState, id: number, ownerId: number) {
  return defineReplicator(ctx, (data?: ArrayBuffer) => {
    const player = new RemoteNode(ctx.resourceManager);
    const avatar = createNodeFromGLTFURI(ctx, "/gltf/full-animation-rig.glb");
    addChild(player, avatar);
    quat.fromEuler(avatar.quaternion, 0, 180, 0);
    // Used in getAvatar()
    addComponent(ctx.world, AvatarRef, player.eid);
    AvatarRef.eid[player.eid] = avatar.eid;
    player.physicsBody = new RemotePhysicsBody(ctx.resourceManager, {
      type: PhysicsBodyType.Kinematic,
    });
    const colliderNode = new RemoteNode(ctx.resourceManager, {
      position: [0, AVATAR_CAPSULE_HEIGHT - 0.1, 0],
    });
    colliderNode.collider = new RemoteCollider(ctx.resourceManager, {
      type: ColliderType.Capsule,
      height: AVATAR_CAPSULE_HEIGHT,
      radius: AVATAR_CAPSULE_RADIUS,
      collisionGroups: playerCollisionGroups,
    });
    addChild(player, colliderNode);
    addNodePhysicsBody(ctx, player);
    return player;
  });
}

export function definePlayerSynchronizer(ctx: GameState, id: number) {
  const _p = new RAPIER.Vector3(0, 0, 0);
  const _v = new RAPIER.Vector3(0, 0, 0);
  const _q = new RAPIER.Quaternion(0, 0, 0, 1);

  const encodePlayerSyncData = (eid: number, cursorView: CursorView) => {
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const camera = getCamera(ctx, node).parent!;

    // transform
    writeFloat32(cursorView, node.position[0]);
    writeFloat32(cursorView, node.position[1]);
    writeFloat32(cursorView, node.position[2]);

    writeFloat32(cursorView, node.quaternion[0]);
    writeFloat32(cursorView, node.quaternion[1]);
    writeFloat32(cursorView, node.quaternion[2]);
    writeFloat32(cursorView, node.quaternion[3]);

    // physics
    writeFloat32(cursorView, RigidBody.velocity[eid][0]);
    writeFloat32(cursorView, RigidBody.velocity[eid][1]);
    writeFloat32(cursorView, RigidBody.velocity[eid][2]);

    // camera
    writeFloat32(cursorView, camera.quaternion[0]);
    writeFloat32(cursorView, camera.quaternion[1]);
    writeFloat32(cursorView, camera.quaternion[2]);
    writeFloat32(cursorView, camera.quaternion[3]);
  };

  const decodePlayerSyncData = (eid: number, cursorView: CursorView) => {
    const player = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const camera = getCamera(ctx, player).parent!;

    const body = RigidBody.store.get(player.eid);

    _p.x = readFloat32(cursorView);
    _p.y = readFloat32(cursorView);
    _p.z = readFloat32(cursorView);

    _q.x = readFloat32(cursorView);
    _q.y = readFloat32(cursorView);
    _q.z = readFloat32(cursorView);
    _q.w = readFloat32(cursorView);

    _v.x = readFloat32(cursorView);
    _v.y = readFloat32(cursorView);
    _v.z = readFloat32(cursorView);

    camera.quaternion[0] = readFloat32(cursorView);
    camera.quaternion[1] = readFloat32(cursorView);
    camera.quaternion[2] = readFloat32(cursorView);
    camera.quaternion[3] = readFloat32(cursorView);

    body?.setTranslation(_p, true);
    body?.setLinvel(_v, true);
    body?.setRotation(_q, true);
  };

  return defineNetworkSynchronizer(ctx, id, encodePlayerSyncData, decodePlayerSyncData);
}
