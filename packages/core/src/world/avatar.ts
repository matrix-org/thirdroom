import {
  MatrixClient,
  MatrixEvent,
  RoomMember,
} from "@robertlong/matrix-js-sdk";
import { GroupCall } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCall";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { World } from "./World";
import { setObject3D } from "./three";
import { ROOM_PROFILE_KEY } from "../ui/matrix/useRoomProfile";
import { registerNetworkTemplate } from "./networking";
import { GroupCallParticipant } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCallParticipant";
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

interface AvatarModuleOptions {
  client: MatrixClient;
  groupCall: GroupCall;
}

function getAvatarUrl(
  client: MatrixClient,
  groupCall: GroupCall,
  participant: GroupCallParticipant
): string | undefined {
  const memberStateEvent = groupCall.room.currentState.getStateEvents(
    "m.room.member",
    participant.member.userId
  );

  if (!memberStateEvent) {
    return;
  }

  const profile = memberStateEvent.getContent()[ROOM_PROFILE_KEY];

  if (!profile) {
    return;
  }

  const avatarMxcUrl = profile.avatarMxcUrl;

  if (!avatarMxcUrl) {
    return;
  }

  const avatarUrl = client.mxcUrlToHttp(avatarMxcUrl);

  if (!avatarUrl) {
    return;
  }

  return avatarUrl;
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

export function AvatarModule(
  world: World,
  { client, groupCall }: AvatarModuleOptions
) {
  const currentAvatarInfos: Map<
    GroupCallParticipant,
    { eid: number; avatarUrl: string }
  > = new Map();

  function onRoomMemberStateChange(
    _event: MatrixEvent,
    _state: any,
    member: RoomMember
  ) {
    if (member.roomId !== groupCall.room.roomId) {
      return;
    }

    const participant = groupCall.participants.find((p) => p.member === member);

    if (!participant) {
      return;
    }

    const nextAvatarUrl = getAvatarUrl(client, groupCall, participant);

    if (!nextAvatarUrl) {
      return;
    }

    const currentAvatarInfo = currentAvatarInfos.get(participant);

    if (!currentAvatarInfo) {
      return;
    }

    const { avatarUrl, eid } = currentAvatarInfo;

    if (avatarUrl !== nextAvatarUrl) {
      loadAvatar(world, eid, nextAvatarUrl);
      currentAvatarInfos.set(participant, {
        eid,
        avatarUrl: nextAvatarUrl,
      });
    }
  }

  client.on("RoomState.members", onRoomMemberStateChange);

  const ParticipantNetworkTemplate: NetworkTemplate = {
    onCreate(
      world: World,
      sender: GroupCallParticipant,
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
      const positionalAudio = new PositionalAudio(audioListener);

      if (sender.usermediaStream) {
        positionalAudio.setMediaStreamSource(sender.usermediaStream);
      } else {
        sender.on("participant_call_feeds_changed", () => {
          if (sender.usermediaStream) {
            positionalAudio.setMediaStreamSource(sender.usermediaStream);
          }
        });
      }

      obj.add(positionalAudio);

      const avatarUrl = getAvatarUrl(client, groupCall, sender);

      if (avatarUrl) {
        loadAvatar(world, eid, avatarUrl);
        currentAvatarInfos.set(sender, {
          eid,
          avatarUrl,
        });
      }
    },
    onUpdate(
      world: World,
      sender: GroupCallParticipant,
      eid: number,
      nid: number,
      data: ParticipantNetworkData
    ): void {
      const obj = getObject3D(world, eid);
      obj.position.fromArray(data.p);
      obj.quaternion.fromArray(data.r);
    },
    onDelete(
      world: World,
      sender: GroupCallParticipant,
      eid: number,
      nid: number
    ) {
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
  };
}
