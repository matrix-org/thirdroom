import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, defineComponent, hasComponent } from "bitecs";
import { quat, vec3 } from "gl-matrix";

import { addInteractableComponent, GRAB_DISTANCE } from "../../plugins/interaction/interaction.game";
import { getSpawnPoints, spawnPointQuery } from "../../plugins/thirdroom/thirdroom.game";
import { addChild } from "../component/transform";
import { GameState } from "../GameTypes";
import { createNodeFromGLTFURI } from "../gltf/gltf.game";
import { GameInputModule } from "../input/input.game";
import { createLineMesh } from "../mesh/mesh.game";
import { GameNetworkState, associatePeerWithEntity } from "../network/network.game";
import { Owned, Networked } from "../network/NetworkComponents";
import { playerCollisionGroups } from "../physics/CollisionGroups";
import { addRigidBody, Kinematic, PhysicsModuleState } from "../physics/physics.game";
import { createPrefabEntity } from "../prefab/prefab.game";
import {
  RemoteNode,
  RemoteMaterial,
  addObjectToWorld,
  RemoteAudioData,
  RemoteAudioEmitter,
  RemoteAudioSource,
} from "../resource/RemoteResources";
import { InteractableType, MaterialType, MaterialAlphaMode, AudioEmitterType } from "../resource/schema";
import { ScriptComponent } from "../scripting/scripting.game";
import { spawnEntity } from "../utils/spawnEntity";
import { teleportEntity } from "../utils/teleportEntity";
import { addCameraRig, CameraRigType } from "./CameraRig.game";
import { SceneCharacterControllerComponent, CharacterControllerType } from "./CharacterController";
import {
  AvatarOptions,
  AVATAR_HEIGHT,
  AVATAR_CAMERA_OFFSET,
  AVATAR_CAPSULE_HEIGHT,
  AVATAR_CAPSULE_RADIUS,
} from "./common";
import { AvatarRef } from "./components";
import { embodyAvatar } from "./embodyAvatar";
import { addFlyControls } from "./FlyCharacterController";
import { addKinematicControls } from "./KinematicCharacterController";
import { Player, OurPlayer } from "./Player";

export const createAvatarRig =
  (input: GameInputModule, physics: PhysicsModuleState) => (ctx: GameState, options: AvatarOptions) => {
    const spawnPoints = spawnPointQuery(ctx.world);

    const container = new RemoteNode(ctx.resourceManager);
    const rig = createNodeFromGLTFURI(ctx, "/gltf/full-animation-rig.glb");

    addChild(container, rig);

    quat.fromEuler(rig.quaternion, 0, 180, 0);

    // on container
    const characterControllerType = SceneCharacterControllerComponent.get(
      ctx.worldResource.environment!.publicScene!.eid
    )?.type;
    if (characterControllerType === CharacterControllerType.Fly || spawnPoints.length === 0) {
      addFlyControls(ctx, container.eid);
    } else {
      addKinematicControls(ctx, container.eid);
    }

    addCameraRig(ctx, container, CameraRigType.PointerLock, [0, AVATAR_HEIGHT - AVATAR_CAMERA_OFFSET, 0]);

    const rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();

    addComponent(ctx.world, Kinematic, container.eid);

    const rigidBody = physics.physicsWorld.createRigidBody(rigidBodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.capsule(AVATAR_CAPSULE_HEIGHT / 2, AVATAR_CAPSULE_RADIUS)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
      .setCollisionGroups(playerCollisionGroups)
      .setTranslation(0, AVATAR_CAPSULE_HEIGHT - 0.1, 0);

    physics.physicsWorld.createCollider(colliderDesc, rigidBody);

    addRigidBody(ctx, container, rigidBody);

    addInteractableComponent(ctx, physics, container, InteractableType.Player);

    addComponent(ctx.world, AvatarRef, container.eid);
    AvatarRef.eid[container.eid] = rig.eid;

    return container;
  };

export const XRControllerComponent = defineComponent();
export const XRHeadComponent = defineComponent();
export const XRRayComponent = defineComponent();

export const createXRHead =
  (input: GameInputModule, physics: PhysicsModuleState) => (ctx: GameState, options?: any) => {
    const node = createNodeFromGLTFURI(ctx, `/gltf/headset.glb`);
    node.scale.set([0.75, 0.75, 0.75]);
    node.position.set([0, 0, 0.1]);

    addComponent(ctx.world, XRHeadComponent, node.eid);

    return node;
  };

export function createXRRay(ctx: GameState, options: any) {
  const color = options.color || [0, 0.3, 1, 0.3];
  const length = options.length || GRAB_DISTANCE;
  const rayMaterial = new RemoteMaterial(ctx.resourceManager, {
    name: "Ray Material",
    type: MaterialType.Standard,
    baseColorFactor: color,
    emissiveFactor: [0.7, 0.7, 0.7],
    metallicFactor: 0,
    roughnessFactor: 0,
    alphaMode: MaterialAlphaMode.BLEND,
  });
  const mesh = createLineMesh(ctx, length, 0.004, rayMaterial);
  const node = new RemoteNode(ctx.resourceManager, {
    mesh,
  });
  node.position[2] = 0.1;

  addComponent(ctx.world, XRRayComponent, node.eid);

  return node;
}

export const createXRHandLeft =
  (input: GameInputModule, physics: PhysicsModuleState) => (ctx: GameState, options?: any) => {
    const node = createNodeFromGLTFURI(ctx, `/gltf/controller-left.glb`);

    addComponent(ctx.world, XRControllerComponent, node.eid);

    return node;
  };

export const createXRHandRight =
  (input: GameInputModule, physics: PhysicsModuleState) => (ctx: GameState, options?: any) => {
    const node = createNodeFromGLTFURI(ctx, `/gltf/controller-right.glb`);

    addComponent(ctx.world, XRControllerComponent, node.eid);

    return node;
  };

export function loadPlayerRig(
  ctx: GameState,
  physics: PhysicsModuleState,
  input: GameInputModule,
  network: GameNetworkState
) {
  ctx.worldResource.activeCameraNode = undefined;

  const rig = createPrefabEntity(ctx, "avatar");
  const eid = rig.eid;

  // addNametag(ctx, AVATAR_HEIGHT + AVATAR_OFFSET, rig, network.peerId);

  associatePeerWithEntity(network, network.peerId, eid);

  rig.name = network.peerId;

  // setup positional audio emitter for footsteps
  rig.audioEmitter = new RemoteAudioEmitter(ctx.resourceManager, {
    type: AudioEmitterType.Positional,
    sources: [
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-01.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-02.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-03.ogg" }),
      }),
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, { uri: "/audio/footstep-04.ogg" }),
      }),
    ],
  });

  // caveat: if owned added after player, this local player entity is added to enteredRemotePlayerQuery
  // TODO: add Authoring component for authoritatively controlled entities as a host,
  //       use Owned to distinguish actual ownership on all clients
  addComponent(ctx.world, Owned, eid);
  addComponent(ctx.world, Player, eid);
  addComponent(ctx.world, OurPlayer, eid);
  // Networked component isn't reset when removed so reset on add
  addComponent(ctx.world, Networked, eid, true);

  addObjectToWorld(ctx, rig);

  const spawnPoints = getSpawnPoints(ctx);

  if (spawnPoints.length > 0) {
    spawnEntity(spawnPoints, rig);
  } else {
    teleportEntity(rig, vec3.fromValues(0, 0, 0), quat.create());
  }

  embodyAvatar(ctx, physics, input, rig);

  const gltfScene = ctx.worldResource.environment?.publicScene;

  if (gltfScene && hasComponent(ctx.world, ScriptComponent, gltfScene.eid)) {
    const script = ScriptComponent.get(gltfScene.eid);

    if (script) {
      script.entered();
    }
  }

  return eid;
}
