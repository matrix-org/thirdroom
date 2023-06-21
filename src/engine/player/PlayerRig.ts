import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, defineComponent } from "bitecs";
import { quat, vec3 } from "gl-matrix";

import { addInteractableComponent, GRAB_DISTANCE } from "../../plugins/interaction/interaction.game";
import { getSpawnPoints, spawnPointQuery } from "../../plugins/thirdroom/thirdroom.game";
import { addChild } from "../component/transform";
import { GameContext } from "../GameTypes";
import { createNodeFromGLTFURI } from "../gltf/gltf.game";
import { GameInputModule } from "../input/input.game";
import { createLineMesh } from "../mesh/mesh.game";
import { getModule } from "../module/module.common";
import { GameNetworkState, associatePeerWithEntity, NetworkModule, setLocalPeerId } from "../network/network.game";
import { Owned, Networked } from "../network/NetworkComponents";
import { playerCollisionGroups } from "../physics/CollisionGroups";
import { addPhysicsBody, addPhysicsCollider, PhysicsModule, PhysicsModuleState } from "../physics/physics.game";
import { createPrefabEntity, PrefabType, registerPrefab } from "../prefab/prefab.game";
import {
  RemoteNode,
  RemoteMaterial,
  addObjectToWorld,
  RemoteAudioData,
  RemoteAudioEmitter,
  RemoteAudioSource,
  RemoteCollider,
  RemotePhysicsBody,
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
import { Player, OurPlayer } from "./Player";

const AVATAR_CAPSULE_HEIGHT = 1;
const AVATAR_CAPSULE_RADIUS = 0.35;
export const AVATAR_HEIGHT = AVATAR_CAPSULE_HEIGHT + AVATAR_CAPSULE_RADIUS * 2;
const AVATAR_CAMERA_OFFSET = 0.06;

export function registerPlayerPrefabs(ctx: GameContext) {
  registerPrefab(ctx, {
    name: "avatar",
    type: PrefabType.Avatar,
    create: (ctx: GameContext) => {
      const physics = getModule(ctx, PhysicsModule);
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

      return container;
    },
  });

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

export const XRControllerComponent = defineComponent();
export const XRHeadComponent = defineComponent();
export const XRRayComponent = defineComponent();

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

export function loadPlayerRig(ctx: GameContext, physics: PhysicsModuleState, input: GameInputModule) {
  ctx.worldResource.activeCameraNode = undefined;

  const rig = createPrefabEntity(ctx, "avatar");

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

  addComponent(ctx.world, Player, rig.eid);
  addComponent(ctx.world, OurPlayer, rig.eid);

  addObjectToWorld(ctx, rig);

  embodyAvatar(ctx, physics, input, rig);

  return rig;
}

export function loadNetworkedPlayerRig(
  ctx: GameContext,
  physics: PhysicsModuleState,
  input: GameInputModule,
  network: GameNetworkState,
  localPeerId: string
) {
  const rig = loadPlayerRig(ctx, physics, input);
  const eid = rig.eid;
  setLocalPeerId(ctx, localPeerId);
  associatePeerWithEntity(network, localPeerId, eid);
  rig.name = localPeerId;
  // TODO: add Authoring component for authoritatively controlled entities as a host,
  //       use Owned to distinguish actual ownership on all clients
  // Networked component isn't reset when removed so reset on add
  addComponent(ctx.world, Owned, eid);
  addComponent(ctx.world, Networked, eid, true);
  return rig;
}

export function spawnPlayer(ctx: GameContext, rig: RemoteNode) {
  const spawnPoints = getSpawnPoints(ctx);

  if (spawnPoints.length > 0) {
    spawnEntity(spawnPoints, rig);
  } else {
    teleportEntity(rig, vec3.fromValues(0, 0, 0), quat.create());
  }
}
