import {
  Client,
  GroupCall,
  // Member,
  PowerLevels,
  SubscriptionHandle,
} from "@thirdroom/hydrogen-view-sdk";

import { Engine } from "../MainThread";

// function memberComparator(a: Member, b: Member): number {
//   if (a.eventTimestamp === b.eventTimestamp) {
//     return a.deviceIndex - b.deviceIndex;
//   }

//   return a.eventTimestamp - b.eventTimestamp;
// }

// function isOlderThanLocalHost(groupCall: GroupCall, member: Member): boolean {
//   if (groupCall.eventTimestamp === member.eventTimestamp) {
//     return groupCall.deviceIndex! < member.deviceIndex;
//   }

//   return groupCall.eventTimestamp! < member.eventTimestamp;
// }

export function createMatrixNetworkInterface(
  engine: Engine,
  client: Client,
  powerLevels: PowerLevels,
  groupCall: GroupCall
): () => void {
  if (!client.session) {
    throw new Error("You must initialize the client session before creating the network interface");
  }

  // TODO: should peer ids be keyed like the call ids? (userId, deviceId, sessionId)?
  // Or maybe just (userId, deviceId)?
  // engine.setPeerId(client.session.userId);

  const { userId } = client.session;

  engine.setHost(true);
  engine.setPeerId(userId);
  engine.setState({ joined: true });

  groupCall.members.subscribe({
    onAdd(_key, member) {
      console.log("groupcall.members.onAdd", member);
      if (member.isConnected && member.dataChannel) {
        engine.addPeer(member.userId, member.dataChannel);
      }
    },
    onRemove(_key, member) {
      engine.removePeer(member.userId);
    },
    onReset() {
      throw new Error("Unexpected reset of groupCall.members");
    },
    onUpdate(_key, member) {
      console.log("groupcall.members.onUpdate", member);

      if (member.isConnected && member.dataChannel && !engine.hasPeer(member.userId)) {
        engine.addPeer(member.userId, member.dataChannel);
      }
      // else if (engine.hasPeer(member.userId)) {
      //   engine.removePeer(member.userId);
      // }
    },
  });

  let unsubscibeMembersObservable: SubscriptionHandle | undefined;

  // getInitialHost(userId)
  //   .then((initialHostId) => joinWorld(userId, initialHostId === userId))
  //   .catch(console.error);

  // function getInitialHost(userId: string): Promise<string> {
  //   // Of the all group call members find the one whose member event is oldest
  //   // If the member has multiple devices get the device with the lowest device index
  //   // Wait for that member to be connected and return their user id
  //   // If the member hasn't connected in 10 seconds, return the longest connected user id

  //   let hostId: string | undefined;

  //   return new Promise((resolve) => {
  //     let timeout: number | undefined = undefined;

  //     const unsubscribe = groupCall.members.subscribe({
  //       onAdd(_key, member) {
  //         // The host connected, resolve with their id
  //         // NOTE: Do we also need to check for older events here? Maybe there's an older member and we
  //         // haven't received their event yet?
  //         if (hostId && member.userId === hostId && member.isConnected && member.dataChannel) {
  //           clearTimeout(timeout);
  //           unsubscribe();
  //           resolve(hostId);
  //         }
  //       },
  //       onRemove(_key, member) {
  //         if (hostId && member.userId === hostId) {
  //           // The current host disconnected, pick the next best host
  //           const sortedMembers = Array.from(new Map(groupCall.members).values()).sort(memberComparator);

  //           // If there are no other members, you're the host
  //           if (sortedMembers.length === 0 || !isOlderThanLocalHost(groupCall, sortedMembers[0])) {
  //             clearTimeout(timeout);
  //             unsubscribe();
  //             resolve(userId);
  //           } else {
  //             const nextHost = sortedMembers[0];

  //             // If the next best host is connected then resolve with their id
  //             if (nextHost.isConnected && member.dataChannel) {
  //               clearTimeout(timeout);
  //               unsubscribe();
  //               resolve(nextHost.userId);
  //             } else {
  //               hostId = nextHost.userId;
  //             }
  //           }
  //         }
  //       },
  //       onReset() {
  //         throw new Error("Unexpected reset of groupCall.members");
  //       },
  //       onUpdate(_key, member) {
  //         // The host connected, resolve with their id
  //         if (hostId && member.userId === hostId && member.isConnected && member.dataChannel) {
  //           clearTimeout(timeout);
  //           unsubscribe();
  //           resolve(hostId);
  //         }
  //       },
  //     });

  //     timeout = window.setTimeout(() => {
  //       // The host hasn't connected yet after 10 seconds. Use the oldest connected host instead.
  //       unsubscribe();

  //       const sortedConnectedMembers = Array.from(new Map(groupCall.members).values())
  //         .sort(memberComparator)
  //         .filter((member) => member.isConnected && member.dataChannel);

  //       if (sortedConnectedMembers.length > 0 && isOlderThanLocalHost(groupCall, sortedConnectedMembers[0])) {
  //         resolve(sortedConnectedMembers[0].userId);
  //       } else {
  //         resolve(userId);
  //       }
  //     }, 10000);

  //     const initialSortedMembers = Array.from(new Map(groupCall.members).values()).sort(memberComparator);

  //     if (initialSortedMembers.length === 0 || !isOlderThanLocalHost(groupCall, initialSortedMembers[0])) {
  //       clearTimeout(timeout);
  //       unsubscribe();
  //       resolve(userId);
  //     } else {
  //       const hostMember = initialSortedMembers[0];

  //       if (hostMember.isConnected && hostMember.dataChannel) {
  //         clearTimeout(timeout);
  //         unsubscribe();
  //         resolve(hostMember.userId);
  //       } else {
  //         hostId = hostMember.userId;
  //       }
  //     }
  //   });
  // }

  // function joinWorld(userId: string, isHost: boolean) {
  //   engine.setHost(isHost);
  //   engine.setPeerId(userId);
  //   engine.setState({ joined: true });

  //   unsubscibeMembersObservable = groupCall.members.subscribe({
  //     onAdd(_key, member) {
  //       if (member.isConnected && member.dataChannel) {
  //         updateHost();
  //         engine.addPeer(member.userId, member.dataChannel);
  //       }
  //     },
  //     onRemove(_key, member) {
  //       updateHost();
  //       engine.removePeer(member.userId);
  //     },
  //     onReset() {
  //       throw new Error("Unexpected reset of groupCall.members");
  //     },
  //     onUpdate(_key, member) {
  //       if (member.isConnected && member.dataChannel && !engine.hasPeer(member.userId)) {
  //         updateHost();
  //         engine.addPeer(member.userId, member.dataChannel);
  //       } else if (engine.hasPeer(member.userId)) {
  //         engine.removePeer(member.userId);
  //       }
  //     },
  //   });

  //   for (const [, member] of groupCall.members) {
  //     if (member.isConnected && member.dataChannel) {
  //       engine.addPeer(member.userId, member.dataChannel);
  //     }
  //   }
  // }

  // function updateHost() {
  //   // Of the connected members find the one whose member event is oldest
  //   // If the member has multiple devices get the device with the lowest device index

  //   const sortedConnectedMembers = Array.from(new Map(groupCall.members).values())
  //     .sort(memberComparator)
  //     .filter((member) => member.isConnected && member.dataChannel);

  //   if (sortedConnectedMembers.length === 0 || !isOlderThanLocalHost(groupCall, sortedConnectedMembers[0])) {
  //     engine.setHost(true);
  //   } else {
  //     engine.setHost(false);
  //   }
  // }

  return () => {
    engine.disconnect();

    engine.setState({ joined: false });

    if (unsubscibeMembersObservable) {
      unsubscibeMembersObservable();
    }
  };
}
