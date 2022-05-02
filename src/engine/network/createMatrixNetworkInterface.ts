import { MatrixClient, GroupCall, MatrixCall, MatrixEvent, GroupCallEvent } from "@thirdroom/matrix-js-sdk";
import { CallEvent } from "@thirdroom/matrix-js-sdk/src/webrtc/call";

import { Engine } from "../MainThread";

function memberStateEventComparator(a: MatrixEvent, b: MatrixEvent): number {
  return a.getTs() - b.getTs();
}

export function createMatrixNetworkInterface(engine: Engine, client: MatrixClient, groupCall: GroupCall): () => void {
  const localUserId = client.getUserId();
  const sortedMemberEvents = groupCall.room.currentState
    .getStateEvents("org.matrix.msc3401.call.member")
    .slice()
    .sort(memberStateEventComparator);

  if (sortedMemberEvents.length === 0) {
    throw new Error("No member state events for group call");
  }

  const initialHostId = sortedMemberEvents[0].getStateKey();

  if (!initialHostId) {
    throw new Error("Event has no state key");
  }

  let hostTimeout: number;
  let targetHostId: string = initialHostId;

  if (targetHostId === localUserId) {
    console.log("local host selected");
    engine.setHost(true);
    engine.setPeerId(localUserId);
    engine.setState({ joined: true });
  } else {
    hostTimeout = window.setTimeout(() => {
      const sortedMemberEvents = groupCall.room.currentState
        .getStateEvents("org.matrix.msc3401.call.member")
        .slice()
        .sort(memberStateEventComparator);

      if (sortedMemberEvents.length === 0) {
        throw new Error("No member state events for group call");
      }

      const fallbackHostId = sortedMemberEvents[0].getStateKey();

      console.log("fallback host connected", fallbackHostId);

      engine.setHost(fallbackHostId === localUserId);
      engine.setPeerId(localUserId);
      engine.setState({ joined: true });
    }, 10000);
  }

  function onDataChannel(dataChannel: RTCDataChannel, call: MatrixCall) {
    const userId = call.invitee || call.getOpponentMember().userId;
    console.log("onDataChannel", dataChannel, userId);

    engine.addPeer(userId, dataChannel);

    if (userId === targetHostId) {
      console.log("target host connected", targetHostId);
      engine.setHost(false);
      engine.setPeerId(localUserId);
      engine.setState({ joined: true });
      clearTimeout(hostTimeout);
    }
  }

  function onParticipantsChanged() {
    const sortedMemberEvents = groupCall.room.currentState
      .getStateEvents("org.matrix.msc3401.call.member")
      .slice()
      .sort(memberStateEventComparator);

    console.log("onParticipantsChanged", sortedMemberEvents);

    if (sortedMemberEvents.length === 0) {
      throw new Error("No member state events for group call");
    }

    const nextHostId = sortedMemberEvents[0].getStateKey();

    if (!nextHostId) {
      throw new Error("Event has no state key");
    }

    targetHostId = nextHostId;

    if (targetHostId === localUserId || engine.hasPeer(targetHostId)) {
      console.log("target host changed and is now connected", targetHostId);
      engine.setHost(targetHostId === localUserId);
      engine.setPeerId(localUserId);
      engine.setState({ joined: true });
      clearTimeout(hostTimeout);
    }
  }

  for (const call of groupCall.calls) {
    const dataChannel = call.dataChannels.get("channel");

    if (dataChannel) {
      engine.addPeer(call.invitee || call.getOpponentMember().userId, dataChannel);
    }
  }

  groupCall.addListener(CallEvent.DataChannel, onDataChannel);
  groupCall.addListener(GroupCallEvent.ParticipantsChanged, onParticipantsChanged);

  return () => {
    clearTimeout(hostTimeout);
    groupCall.removeListener(CallEvent.DataChannel, onDataChannel);
    groupCall.removeListener(GroupCallEvent.ParticipantsChanged, onParticipantsChanged);
    groupCall.leave();
    engine.disconnect();
    engine.setState({ joined: false });
  };
}
