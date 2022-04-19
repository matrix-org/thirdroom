import { Client, GroupCall } from "hydrogen-view-sdk";

import { NetworkInterface } from "./NetworkInterface";

export function createMatrixNetworkInterface(client: Client, groupCall: GroupCall): NetworkInterface {
  if (!client.session) {
    throw new Error("You must initialize the client session before creating the network interface");
  }

  return {
    localPeerId: client.session.userId,
    createHandler: (onPeerJoined, onPeerAudioStreamChanged, onPeerLeft) => {
      const unsubscribe = groupCall.members.subscribe({
        onAdd(name, member) {
          console.log("member add", name, member, member.isConnected);
        },
        onRemove(name, member) {
          console.log("member remove", name, member, member.isConnected);
        },
        onReset() {
          console.log("members reset");
        },
        onUpdate(name, member, params) {
          console.log("member update", name, member, member.isConnected);
        },
      });

      for (const [name, member] of groupCall.members) {
        console.log("member add", name, member, member.isConnected);
      }

      return () => {
        unsubscribe();
      };
    },
  };
}
