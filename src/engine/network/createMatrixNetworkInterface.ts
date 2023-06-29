import {
  CallIntent,
  Client,
  GroupCall,
  LocalMedia,
  Member,
  Platform,
  Room,
  Session,
  SubscriptionHandle,
} from "@thirdroom/hydrogen-view-sdk";

import { exitWorld } from "../../plugins/thirdroom/thirdroom.main";
import { setLocalMediaStream } from "../audio/audio.main";
import { MainContext } from "../MainThread";
import { addPeer, disconnect, hasPeer, removePeer, setHost } from "./network.main";
import { getRoomCall } from "../../ui/utils/matrixUtils";

export interface MatrixNetworkInterface {
  dispose: () => void;
}

function memberComparator(a: Member, b: Member): number {
  if (a.eventTimestamp === b.eventTimestamp) {
    return a.deviceIndex - b.deviceIndex;
  }

  return a.eventTimestamp - b.eventTimestamp;
}

function isOlderThanLocalHost(groupCall: GroupCall, member: Member): boolean {
  if (groupCall.eventTimestamp === member.eventTimestamp) {
    return groupCall.deviceIndex! <= member.deviceIndex;
  }

  return groupCall.eventTimestamp! < member.eventTimestamp;
}

function getReliableHost(groupCall: GroupCall): Member | undefined {
  const sortedMembers = Array.from(new Map(groupCall.members).values())
    .sort(memberComparator)
    .filter((member) => member.isConnected && member.dataChannel);

  if (sortedMembers.length === 0) return undefined;
  if (isOlderThanLocalHost(groupCall, sortedMembers[0])) return undefined;

  return sortedMembers[0];
}

const getWorldGroupCall = (session: Session, world: Room) => getRoomCall(session.callHandler.calls, world.id);

export async function createMatrixNetworkInterface(
  ctx: MainContext,
  client: Client,
  platform: Platform,
  world: Room
): Promise<MatrixNetworkInterface> {
  const session = client.session;

  if (!session) {
    throw new Error("You must initialize the client session before creating the network interface");
  }

  let groupCall = getWorldGroupCall(session, world);

  if (!groupCall) {
    groupCall = await session.callHandler.createCall(world.id, "m.voice", "World Call", CallIntent.Room);
  }

  let stream;
  try {
    stream = await platform.mediaDevices.getMediaTracks(true, false);
  } catch (err) {
    console.error(err);
  }
  const localMedia = stream
    ? new LocalMedia().withUserMedia(stream).withDataChannel({})
    : new LocalMedia().withDataChannel({});

  await groupCall.join(localMedia);

  // Mute after connecting based on user preference
  if (groupCall.muteSettings?.microphone === false && localStorage.getItem("microphone") !== "true") {
    groupCall.setMuted(groupCall.muteSettings.toggleMicrophone());
  }

  setLocalMediaStream(ctx, groupCall.localMedia?.userMedia);

  // TODO: should peer ids be keyed like the call ids? (userId, deviceId, sessionId)?
  // Or maybe just (userId, deviceId)?
  // engine.setPeerId(client.session.userId);

  let unsubscibeMembersObservable: SubscriptionHandle | undefined;

  const userId = session.userId;

  const initialHostId = await getInitialHost(groupCall, userId);
  await joinWorld(groupCall, userId, initialHostId === userId);

  function getInitialHost(groupCall: GroupCall, userId: string): Promise<string> {
    // Of the all group call members find the one whose member event is oldest
    // If the member has multiple devices get the device with the lowest device index
    // Wait for that member to be connected and return their user id
    // If the member hasn't connected in 10 seconds, return the longest connected user id

    return new Promise((resolve) => {
      let timeout: number | undefined = undefined;

      const reliableHost = getReliableHost(groupCall);
      if (reliableHost) {
        resolve(reliableHost.userId);
        return;
      }
      if (groupCall.members.size === 0) {
        resolve(userId);
        return;
      }

      const unsubscribe = groupCall.members.subscribe({
        onAdd() {
          const host = getReliableHost(groupCall);
          if (host) {
            clearTimeout(timeout);
            unsubscribe();
            resolve(host.userId);
          }
        },
        onRemove() {
          const host = getReliableHost(groupCall);
          if (host) {
            clearTimeout(timeout);
            unsubscribe();
            resolve(host.userId);
          }
        },
        onReset() {
          throw new Error("Unexpected reset of groupCall.members");
        },
        onUpdate() {
          const host = getReliableHost(groupCall);
          if (host) {
            clearTimeout(timeout);
            unsubscribe();
            resolve(host.userId);
          }
        },
      });

      // wait if any member to become reliable.
      // resolve otherwise
      timeout = window.setTimeout(() => {
        unsubscribe();
        const host = getReliableHost(groupCall);
        resolve(host?.userId ?? userId);
      }, 10000);
    });
  }

  async function joinWorld(groupCall: GroupCall, userId: string, isHost: boolean) {
    if (isHost) setHost(ctx, userId);

    unsubscibeMembersObservable = groupCall.members.subscribe({
      onAdd(_key, member) {
        if (member.isConnected && member.dataChannel) {
          updateHost(groupCall, userId);
          addPeer(ctx, member.userId, member.dataChannel, member.remoteMedia?.userMedia);
        }
      },
      onRemove(_key, member) {
        updateHost(groupCall, userId);
        removePeer(ctx, member.userId);
      },
      onReset() {
        throw new Error("Unexpected reset of groupCall.members");
      },
      onUpdate(_key, member) {
        if (member.isConnected && member.dataChannel && !hasPeer(ctx, member.userId)) {
          updateHost(groupCall, userId);
          addPeer(ctx, member.userId, member.dataChannel, member.remoteMedia?.userMedia);
        }
      },
    });

    for (const [, member] of groupCall.members) {
      if (member.isConnected && member.dataChannel) {
        addPeer(ctx, member.userId, member.dataChannel, member.remoteMedia?.userMedia);
      }
    }
  }

  function updateHost(groupCall: GroupCall, userId: string) {
    // Of the connected members find the one whose member event is oldest
    // If the member has multiple devices get the device with the lowest device index

    const reliableHost = getReliableHost(groupCall);

    if (reliableHost) {
      // TODO: use powerlevels to determine host
      setHost(ctx, reliableHost.userId);
    } else {
      setHost(ctx, userId);
    }
  }

  return {
    dispose: () => {
      disconnect(ctx);

      exitWorld(ctx);

      setLocalMediaStream(ctx, undefined);

      if (unsubscibeMembersObservable) {
        unsubscibeMembersObservable();
      }

      if (groupCall) {
        groupCall.leave();
      }
    },
  };
}

let baseMxNetworkInterface: MatrixNetworkInterface | undefined;
export const registerMatrixNetworkInterface = (matrixNetworkInterface: MatrixNetworkInterface) => {
  baseMxNetworkInterface = matrixNetworkInterface;
};
export const provideMatrixNetworkInterface = (
  update: (mxNetworkInterface: MatrixNetworkInterface | undefined) => void
) => {
  update(baseMxNetworkInterface);
};
