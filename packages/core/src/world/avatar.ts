import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { World } from "./World";
import { setObject3D } from "./three";
import { registerNetworkTemplate } from "./networking";
import { NetworkTemplate } from "./networking";
import { addObject3D, getObject3D, removeObject3D } from "./three";
import {
  Mesh,
  BoxBufferGeometry,
  MeshBasicMaterial,
  PositionalAudio,
  AudioListener,
} from "three";

interface ParticipantNetworkData {
  p: number[];
  r: number[];
}

async function loadAvatar(world: World, eid: number, avatarUrl: string) {
  const gltfLoader = new GLTFLoader();

  const { scene } = await gltfLoader.loadAsync(avatarUrl);

  for (const child of scene.children) {
    child.rotation.set(0, Math.PI, 0);
    child.scale.set(2, 2, 2);
  }

  setObject3D(world, eid, scene);
}

export function AvatarModule(world: World) {
  const currentAvatarInfos: Map<string, { eid: number; avatarUrl: string }> =
    new Map();

  function setParticipantAvatarUrl(userId: string, nextAvatarUrl: string) {
    const currentAvatarInfo = currentAvatarInfos.get(userId);

    if (!currentAvatarInfo) {
      return;
    }

    const { avatarUrl, eid } = currentAvatarInfo;

    if (avatarUrl !== nextAvatarUrl) {
      loadAvatar(world, eid, nextAvatarUrl);
      currentAvatarInfos.set(userId, {
        eid,
        avatarUrl: nextAvatarUrl,
      });
    }
  }

  const participantAudioObjs: Map<string, PositionalAudio> = new Map();

  function setParticipantAudioStream(userId: string, stream: MediaStream) {
    const positionalAudio = participantAudioObjs.get(userId);

    if (!positionalAudio) {
      console.warn(`Can't find positional audio for user: ${userId}`);
      return;
    }

    positionalAudio.setMediaStreamSource(stream);
  }

  const ParticipantNetworkTemplate: NetworkTemplate = {
    onCreate(
      world: World,
      senderId: number,
      eid: number,
      nid: number,
      data: ParticipantNetworkData
    ): void {
      const obj = addObject3D(
        world,
        eid,
        new Mesh(
          new BoxBufferGeometry(),
          new MeshBasicMaterial({ color: 0xff0000 })
        ),
        getObject3D(world, world.sceneEid)
      );
      obj.position.fromArray(data.p);
      obj.quaternion.fromArray(data.r);
      const audioListener = getObject3D<AudioListener>(
        world,
        world.audioListenerEid
      );
      obj.add(new PositionalAudio(audioListener));
    },
    onUpdate(
      world: World,
      senderId: number,
      eid: number,
      nid: number,
      data: ParticipantNetworkData
    ): void {
      const obj = getObject3D(world, eid);
      obj.position.fromArray(data.p);
      obj.quaternion.fromArray(data.r);
    },
    onDelete(world: World, senderId: number, eid: number, nid: number) {
      removeObject3D(world, eid);
      //participantEids.delete(sender.member.userId);
    },
    sendCreate(world: World, eid: number, nid: number): ParticipantNetworkData {
      const obj = getObject3D(world, eid);
      return { p: obj.position.toArray([]), r: obj.quaternion.toArray([]) };
    },
    sendUpdate(world: World, eid: number, nid: number): ParticipantNetworkData {
      const obj = getObject3D(world, eid);
      return { p: obj.position.toArray([]), r: obj.quaternion.toArray([]) };
    },
  };

  registerNetworkTemplate(world, ParticipantNetworkTemplate);

  return {
    ParticipantNetworkTemplate,
    setParticipantAvatarUrl,
    setParticipantAudioStream,
  };
}
