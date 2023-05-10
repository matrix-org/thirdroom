import { Client, GroupCall, Member, PowerLevels, SubscriptionHandle } from "@thirdroom/hydrogen-view-sdk";

import { exitWorld } from "../../plugins/thirdroom/thirdroom.main";
import { setLocalMediaStream } from "../audio/audio.main";
import { IMainThreadContext } from "../MainThread";
import { addPeer, disconnect, hasPeer, removePeer, setHost, setPeerId } from "./network.main";

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

export async function createMatrixNetworkInterface(
  ctx: IMainThreadContext,
  client: Client,
  powerLevels: PowerLevels,
  groupCall: GroupCall
): Promise<MatrixNetworkInterface> {
  if (!client.session) {
    throw new Error("You must initialize the client session before creating the network interface");
  }

  // TODO: should peer ids be keyed like the call ids? (userId, deviceId, sessionId)?
  // Or maybe just (userId, deviceId)?
  // engine.setPeerId(client.session.userId);

  let unsubscibeMembersObservable: SubscriptionHandle | undefined;

  const userId = client.session.userId;

  console.log(`====> Group Call Members: `, groupCall.members);
  console.log("====| Waiting to get Initial Host");
  const initialHostId = await getInitialHost(userId);
  console.log(`====> Initial Host: ${initialHostId}`);
  console.log("====| Waiting to Join World");
  await joinWorld(userId, initialHostId === userId);
  console.log("====> World Joined");
  // window.groupCall = groupCall;

  function getInitialHost(userId: string): Promise<string> {
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
      console.log("====> Waiting for Host to become reliable");
      timeout = window.setTimeout(() => {
        console.log("====> TIMEOUT");
        unsubscribe();
        const host = getReliableHost(groupCall);
        resolve(host?.userId ?? userId);
      }, 10000);
    });
  }

  async function joinWorld(userId: string, isHost: boolean) {
    if (isHost) setHost(ctx, userId);
    setPeerId(ctx, userId);

    console.log("====| Observing Call Members");
    unsubscibeMembersObservable = groupCall.members.subscribe({
      onAdd(_key, member) {
        console.log(`====> Call Member Added: ${member.userId}`);
        if (member.isConnected && member.dataChannel) {
          console.log(`====> Adding Peer: ${member.userId}`);
          updateHost(userId);
          addPeer(ctx, member.userId, member.dataChannel, member.remoteMedia?.userMedia);
        }
      },
      onRemove(_key, member) {
        console.log(`====> Removing Peer: ${member.userId}`);
        updateHost(userId);
        removePeer(ctx, member.userId);
      },
      onReset() {
        throw new Error("Unexpected reset of groupCall.members");
      },
      onUpdate(_key, member) {
        console.log(`====> Call Member Updated: ${member.userId}`);
        if (member.isConnected && member.dataChannel && !hasPeer(ctx, member.userId)) {
          console.log(`====> Adding Peer: ${member.userId}`);
          updateHost(userId);
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

  function updateHost(userId: string) {
    // Of the connected members find the one whose member event is oldest
    // If the member has multiple devices get the device with the lowest device index

    const reliableHost = getReliableHost(groupCall);

    if (reliableHost) {
      console.log("====> Updating Host: ", reliableHost.userId);
      // TODO: use powerlevels to determine host
      setHost(ctx, reliableHost.userId);
    } else {
      console.log("====> Updating Host: ", userId);
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

      groupCall.leave();
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
