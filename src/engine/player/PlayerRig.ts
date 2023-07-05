import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent } from "bitecs";
import { quat, vec3 } from "gl-matrix";

import { addInteractableComponent, GRAB_DISTANCE } from "../../plugins/interaction/interaction.game";
import {
  getSpawnPoints,
  spawnPointQuery,
  ThirdRoomModule,
  ThirdRoomModuleState,
} from "../../plugins/thirdroom/thirdroom.game";
import { addChild } from "../component/transform";
import { GameContext } from "../GameTypes";
import { createNodeFromGLTFURI } from "../gltf/gltf.game";
import { createLineMesh } from "../mesh/mesh.game";
import { getModule } from "../module/module.common";
import { NetworkModule, tryGetPeerIndex } from "../network/network.game";
import { Authoring, Networked } from "../network/NetworkComponents";
import { playerCollisionGroups } from "../physics/CollisionGroups";
import { addPhysicsBody, addPhysicsCollider, PhysicsModule } from "../physics/physics.game";
import { PrefabType, registerPrefab } from "../prefab/prefab.game";
import {
  RemoteNode,
  RemoteMaterial,
  addObjectToWorld,
  RemoteAudioData,
  RemoteAudioEmitter,
  RemoteAudioSource,
  RemoteCollider,
  RemotePhysicsBody,
  removeObjectFromWorld,
} from "../resource/RemoteResources";
import { getRemoteResource } from "../resource/resource.game";
import {
  InteractableType,
  MaterialType,
  MaterialAlphaMode,
  AudioEmitterType,
  PhysicsBodyType,
  ColliderType,
} from "../resource/schema";
import { spawnEntity } from "../utils/spawnEntity";
import { teleportEntity } from "../utils/teleportEntity";
import { addCameraRig, CameraRigType } from "./CameraRig";
import { SceneCharacterControllerComponent, CharacterControllerType } from "./CharacterController";
import { AvatarRef } from "./components";
import { embodyAvatar } from "./embodyAvatar";
import { addFlyControls } from "./FlyCharacterController";
import { addKinematicControls } from "./KinematicCharacterController";
import { addNametag } from "./nametags.game";
import { Player } from "./Player";
import { XRControllerComponent, XRHeadComponent, XRRayComponent } from "./XRComponents";
import { createNetworkReplicator } from "../network/NetworkReplicator";
import { CursorView } from "../allocator/CursorView";
import { readTransform, writeTransform } from "../network/NetworkMessage";
import { Codec } from "../network/Codec";
import { isHost } from "../network/network.common";

const AVATAR_CAPSULE_HEIGHT = 1;
const AVATAR_CAPSULE_RADIUS = 0.35;
export const AVATAR_HEIGHT = AVATAR_CAPSULE_HEIGHT + AVATAR_CAPSULE_RADIUS * 2;
const AVATAR_CAMERA_OFFSET = 0.06;

const avatarFactory = (ctx: GameContext) => {
  const physics = getModule(ctx, PhysicsModule);

  const container = new RemoteNode(ctx.resourceManager);
  const rig = createNodeFromGLTFURI(ctx, "/gltf/full-animation-rig.glb");

  addChild(container, rig);

  quat.fromEuler(rig.quaternion, 0, 180, 0);

  addPhysicsCollider(
    ctx.world,
    container,
    new RemoteCollider(ctx.resourceManager, {
      type: ColliderType.Capsule,
      height: AVATAR_CAPSULE_HEIGHT + 0.15,
      radius: AVATAR_CAPSULE_RADIUS,
      activeEvents: RAPIER.ActiveEvents.COLLISION_EVENTS,
      collisionGroups: playerCollisionGroups,
      offset: [0, AVATAR_CAPSULE_HEIGHT - 0.15, 0],
    })
  );

  addPhysicsBody(
    ctx.world,
    physics,
    container,
    new RemotePhysicsBody(ctx.resourceManager, {
      type: PhysicsBodyType.Kinematic,
    })
  );

  addInteractableComponent(ctx, physics, container, InteractableType.Player);

  addComponent(ctx.world, AvatarRef, container.eid);
  AvatarRef.eid[container.eid] = rig.eid;

  // TODO: reuse audio sources+data
  container.audioEmitter = new RemoteAudioEmitter(ctx.resourceManager, {
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

  return container;
};

const transformCodec: Codec<RemoteNode> = {
  encode: (view: CursorView, node: RemoteNode) => {
    return writeTransform(view, node);
  },
  decode: (view: CursorView, node: RemoteNode) => {
    return readTransform(view, node);
  },
};

export function registerPlayerPrefabs(ctx: GameContext, thirdroom: ThirdRoomModuleState) {
  thirdroom.replicators = {
    avatar: createNetworkReplicator(ctx, avatarFactory, transformCodec),
  };

  registerPrefab(ctx, {
    name: "xr-head",
    type: PrefabType.Avatar,
    create: (ctx: GameContext, options?: any) => {
      const node = createNodeFromGLTFURI(ctx, `/gltf/headset.glb`);
      node.scale.set([0.75, 0.75, 0.75]);
      node.position.set([0, 0, 0.1]);

      addComponent(ctx.world, XRHeadComponent, node.eid);

      return node;
    },
  });

  registerPrefab(ctx, {
    name: "xr-hand-left",
    type: PrefabType.Avatar,
    create: (ctx: GameContext, options?: any) => {
      const node = createNodeFromGLTFURI(ctx, `/gltf/controller-left.glb`);

      addComponent(ctx.world, XRControllerComponent, node.eid);

      return node;
    },
  });

  registerPrefab(ctx, {
    name: "xr-hand-right",
    type: PrefabType.Avatar,
    create: (ctx: GameContext, options?: any) => {
      const node = createNodeFromGLTFURI(ctx, `/gltf/controller-right.glb`);

      addComponent(ctx.world, XRControllerComponent, node.eid);

      return node;
    },
  });

  registerPrefab(ctx, {
    name: "xr-ray",
    type: PrefabType.Avatar,
    create: (ctx: GameContext, options: any) => {
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
    },
  });
}

export function addPlayerFromPeer(ctx: GameContext, eid: number, peerId: string) {
  const network = getModule(ctx, NetworkModule);

  addComponent(ctx.world, Player, eid);

  const peerNode = getRemoteResource<RemoteNode>(ctx, eid)!;

  peerNode.audioEmitter = new RemoteAudioEmitter(ctx.resourceManager, {
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
      new RemoteAudioSource(ctx.resourceManager, {
        audio: new RemoteAudioData(ctx.resourceManager, {
          uri: `mediastream:${peerId}`,
        }),
        autoPlay: true,
      }),
    ],
  });

  peerNode.name = peerId;

  // if not our own avatar, add nametag
  if (peerId !== network.peerId) {
    addNametag(ctx, AVATAR_HEIGHT + AVATAR_HEIGHT / 3, peerNode, peerId);
  }
}

export function teleportToSpawnPoint(ctx: GameContext, rig: RemoteNode) {
  const spawnPoints = getSpawnPoints(ctx);

  if (spawnPoints.length > 0) {
    spawnEntity(spawnPoints, rig);
  } else {
    teleportEntity(rig, vec3.fromValues(0, 0, 0), quat.create());
  }
}

export function SpawnAvatarSystem(ctx: GameContext) {
  const thirdroom = getModule(ctx, ThirdRoomModule);
  const physics = getModule(ctx, PhysicsModule);
  const network = getModule(ctx, NetworkModule);

  const spawned = thirdroom.replicators!.avatar.spawned;
  const despawned = thirdroom.replicators!.avatar.despawned;

  let spawn;
  while ((spawn = spawned.dequeue())) {
    const avatar = spawn.node;

    addObjectToWorld(ctx, avatar);

    const localPeerIndex = tryGetPeerIndex(network, network.peerId);
    const authorIndex = BigInt(Networked.authorIndex[avatar.eid]);
    const hosting = isHost(network);

    const authoring = authorIndex === localPeerIndex;
    if (authoring) {
      // if we aren't hosting
      if (!hosting) {
        // add Authoring component so that our avatar updates are sent to the host (client-side authority)
        addComponent(ctx.world, Authoring, avatar.eid);
        Networked.authorIndex[avatar.eid] = Number(localPeerIndex);

        // probably don't need to do this anymore
        // associatePeerWithEntity(network, network.peerId, avatar.eid);
      }

      // add appropriate controls
      const characterControllerType = SceneCharacterControllerComponent.get(
        ctx.worldResource.environment!.publicScene!.eid
      )?.type;
      const spawnPoints = spawnPointQuery(ctx.world);
      if (characterControllerType === CharacterControllerType.Fly || spawnPoints.length === 0) {
        addFlyControls(ctx, avatar.eid);
      } else {
        addKinematicControls(ctx, avatar.eid);
      }

      // add camerar rig and embody the avatar
      // TODO: maybe refactor this portion
      addCameraRig(ctx, avatar, CameraRigType.PointerLock, [0, AVATAR_HEIGHT - AVATAR_CAMERA_OFFSET, 0]);
      embodyAvatar(ctx, physics, avatar);
    } else {
      const peerId = network.indexToPeerId.get(authorIndex)!;
      avatar.name = peerId;
      addNametag(ctx, AVATAR_HEIGHT + AVATAR_HEIGHT / 3, avatar, peerId);
      addComponent(ctx.world, Player, avatar.eid);
    }
  }

  let avatar;
  while ((avatar = despawned.dequeue())) {
    removeObjectFromWorld(ctx, avatar);

    const localPeerIndex = tryGetPeerIndex(network, network.peerId);
    const authorIndex = BigInt(Networked.authorIndex[avatar.eid]);
    const hosting = isHost(network);

    const authoring = authorIndex === localPeerIndex;

    if (authoring) {
      // TODO: cleanup relevant network state
    }

    if (hosting) {
      // TODO: clean up relevant host state
    }
  }
}
