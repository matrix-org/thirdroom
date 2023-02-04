import { Client, GroupCall, Member, PowerLevels, SubscriptionHandle } from "@thirdroom/hydrogen-view-sdk";

import { enterWorld, exitWorld } from "../../plugins/thirdroom/thirdroom.main";
import { setLocalMediaStream } from "../audio/audio.main";
import { IMainThreadContext } from "../MainThread";
import { addPeer, disconnect, hasPeer, removePeer, setHost, setPeerId } from "./network.main";

function memberComparator(a: Member, b: Member): number {
  if (a.eventTimestamp === b.eventTimestamp) {
    return a.deviceIndex - b.deviceIndex;
  }

  return a.eventTimestamp - b.eventTimestamp;
}

function isOlderThanLocalHost(groupCall: GroupCall, member: Member): boolean {
  if (groupCall.eventTimestamp === member.eventTimestamp) {
    return groupCall.deviceIndex! < member.deviceIndex;
  }

  return groupCall.eventTimestamp! < member.eventTimestamp;
}

export async function createMatrixNetworkInterface(
  ctx: IMainThreadContext,
  client: Client,
  powerLevels: PowerLevels,
  groupCall: GroupCall
): Promise<() => void> {
  if (!client.session) {
    throw new Error("You must initialize the client session before creating the network interface");
  }

  // TODO: should peer ids be keyed like the call ids? (userId, deviceId, sessionId)?
  // Or maybe just (userId, deviceId)?
  // engine.setPeerId(client.session.userId);

  let unsubscibeMembersObservable: SubscriptionHandle | undefined;

  const userId = client.session.userId;

  const initialHostId = await getInitialHost(userId);
  await joinWorld(userId, initialHostId === userId);

  function getInitialHost(userId: string): Promise<string> {
    // Of the all group call members find the one whose member event is oldest
    // If the member has multiple devices get the device with the lowest device index
    // Wait for that member to be connected and return their user id
    // If the member hasn't connected in 10 seconds, return the longest connected user id

    let hostId: string | undefined;

    return new Promise((resolve) => {
      let timeout: number | undefined = undefined;

      const unsubscribe = groupCall.members.subscribe({
        onAdd(_key, member) {
          // The host connected, resolve with their id
          // NOTE: Do we also need to check for older events here? Maybe there's an older member and we
          // haven't received their event yet?
          if (hostId && member.userId === hostId && member.isConnected && member.dataChannel) {
            clearTimeout(timeout);
            unsubscribe();
            resolve(hostId);
          }
        },
        onRemove(_key, member) {
          if (hostId && member.userId === hostId) {
            // The current host disconnected, pick the next best host
            const sortedMembers = Array.from(new Map(groupCall.members).values()).sort(memberComparator);

            // If there are no other members, you're the host
            if (sortedMembers.length === 0 || !isOlderThanLocalHost(groupCall, sortedMembers[0])) {
              clearTimeout(timeout);
              unsubscribe();
              resolve(userId);
            } else {
              const nextHost = sortedMembers[0];

              // If the next best host is connected then resolve with their id
              if (nextHost.isConnected && member.dataChannel) {
                clearTimeout(timeout);
                unsubscribe();
                resolve(nextHost.userId);
              } else {
                hostId = nextHost.userId;
              }
            }
          }
        },
        onReset() {
          throw new Error("Unexpected reset of groupCall.members");
        },
        onUpdate(_key, member) {
          // The host connected, resolve with their id
          if (hostId && member.userId === hostId && member.isConnected && member.dataChannel) {
            clearTimeout(timeout);
            unsubscribe();
            resolve(hostId);
          }
        },
      });

      timeout = window.setTimeout(() => {
        // The host hasn't connected yet after 10 seconds. Use the oldest connected host instead.
        unsubscribe();

        const sortedConnectedMembers = Array.from(new Map(groupCall.members).values())
          .sort(memberComparator)
          .filter((member) => member.isConnected && member.dataChannel);

        if (sortedConnectedMembers.length > 0 && isOlderThanLocalHost(groupCall, sortedConnectedMembers[0])) {
          resolve(sortedConnectedMembers[0].userId);
        } else {
          resolve(userId);
        }
      }, 10000);

      const initialSortedMembers = Array.from(new Map(groupCall.members).values()).sort(memberComparator);

      if (initialSortedMembers.length === 0 || !isOlderThanLocalHost(groupCall, initialSortedMembers[0])) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(userId);
      } else {
        const hostMember = initialSortedMembers[0];

        if (hostMember.isConnected && hostMember.dataChannel) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(hostMember.userId);
        } else {
          hostId = hostMember.userId;
        }
      }
    });
  }

  async function joinWorld(userId: string, isHost: boolean) {
    if (isHost) setHost(ctx, userId);
    setPeerId(ctx, userId);
    setLocalMediaStream(ctx, groupCall.localMedia?.userMedia);
    await enterWorld(ctx);

    unsubscibeMembersObservable = groupCall.members.subscribe({
      onAdd(_key, member) {
        if (member.isConnected && member.dataChannel) {
          updateHost(userId);
          addPeer(ctx, member.userId, member.dataChannel, member.remoteMedia?.userMedia);
        }
      },
      onRemove(_key, member) {
        updateHost(userId);
        removePeer(ctx, member.userId);
      },
      onReset() {
        throw new Error("Unexpected reset of groupCall.members");
      },
      onUpdate(_key, member) {
        if (member.isConnected && member.dataChannel && !hasPeer(ctx, member.userId)) {
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

    const sortedConnectedMembers = Array.from(new Map(groupCall.members).values())
      .sort(memberComparator)
      .filter((member) => member.isConnected && member.dataChannel);

    if (sortedConnectedMembers.length === 0 || isOlderThanLocalHost(groupCall, sortedConnectedMembers[0])) {
      setHost(ctx, userId);
    } else {
      // TODO: use powerlevels to determine host
      // find youngest member for now
      const hostMember = sortedConnectedMembers.sort((a, b) => {
        if (a.eventTimestamp === b.eventTimestamp) {
          return a.deviceIndex! > b.deviceIndex ? 1 : -1;
        }
        return a.eventTimestamp! > b.eventTimestamp ? 1 : -1;
      })[0];
      setHost(ctx, hostMember.userId);
    }
  }

  return () => {
    disconnect(ctx);

    exitWorld(ctx);
    setLocalMediaStream(ctx, undefined);

    if (unsubscibeMembersObservable) {
      unsubscibeMembersObservable();
    }

    groupCall.leave();
  };
}
