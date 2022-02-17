import { useCallback, useContext, useEffect, useState, useRef } from "react";
import { ClientContext } from "./ClientContext";
import { Room } from "@robertlong/matrix-js-sdk";
import { CallType } from "@robertlong/matrix-js-sdk/lib/webrtc/call";
import { GroupCall } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCall";
import { GroupCallParticipant } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCallParticipant";

// https://stackoverflow.com/a/9039885
function isIOS() {
  return (
    [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod",
    ].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
}

function usePageUnload(callback: (...args: any[]) => any) {
  useEffect(() => {
    let pageVisibilityTimeout: number;

    function onBeforeUnload(event: Event) {
      if (event.type === "visibilitychange") {
        if (document.visibilityState === "visible") {
          clearTimeout(pageVisibilityTimeout);
        } else {
          // Wait 5 seconds before closing the page to avoid accidentally leaving
          // TODO: Make this configurable?
          pageVisibilityTimeout = window.setTimeout(() => {
            callback();
          }, 5000);
        }
      } else {
        callback();
      }
    }

    // iOS doesn't fire beforeunload event, so leave the call when you hide the page.
    if (isIOS()) {
      window.addEventListener("pagehide", onBeforeUnload);
      document.addEventListener("visibilitychange", onBeforeUnload);
    }

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("pagehide", onBeforeUnload);
      document.removeEventListener("visibilitychange", onBeforeUnload);
      window.removeEventListener("beforeunload", onBeforeUnload);
      clearTimeout(pageVisibilityTimeout);
    };
  }, []);
}

function getParticipants(groupCall: GroupCall): GroupCallParticipant[] {
  return [...groupCall.participants];
}

interface UseGroupCallState {
  loading: boolean;
  entered: boolean;
  entering: boolean;
  room?: Room;
  participants: GroupCallParticipant[];
  error?: Error;
  microphoneMuted: boolean;
  localVideoMuted: boolean;
}

interface UseGroupCallReturn {
  loading: boolean;
  entered: boolean;
  entering: boolean;
  roomName?: string;
  participants: GroupCallParticipant[];
  groupCall?: GroupCall;
  microphoneMuted: boolean;
  localVideoMuted: boolean;
  error?: Error;
  initLocalParticipant: () => Promise<GroupCallParticipant>;
  enter: () => void;
  leave: () => void;
  toggleLocalVideoMuted: () => void;
  toggleMicrophoneMuted: () => void;
}

export function useGroupCall(room?: Room): UseGroupCallReturn {
  const { client } = useContext(ClientContext);
  const groupCallRef = useRef<GroupCall>();

  const [
    {
      loading,
      entered,
      entering,
      participants,
      error,
      microphoneMuted,
      localVideoMuted,
    },
    setState,
  ] = useState<UseGroupCallState>({
    loading: true,
    entered: false,
    entering: false,
    participants: [],
    error: undefined,
    microphoneMuted: false,
    localVideoMuted: false,
  });

  const updateState = (state: {}) =>
    setState((prevState) => ({ ...prevState, ...state }));

  useEffect(() => {
    if (!client || !room) {
      return;
    }

    function onParticipantsChanged() {
      if (groupCallRef.current) {
        updateState({ participants: getParticipants(groupCallRef.current) });
      }
    }

    function onLocalMuteStateChanged(
      microphoneMuted: boolean,
      localVideoMuted: boolean
    ) {
      updateState({
        microphoneMuted,
        localVideoMuted,
      });
    }

    try {
      const groupCall = client.createGroupCall(
        room.roomId,
        CallType.Voice,
        true
      );
      groupCallRef.current = groupCall;
      groupCall.on("active_speaker_changed", onParticipantsChanged);
      groupCall.on("participants_changed", onParticipantsChanged);
      groupCall.on("speaking", onParticipantsChanged);
      groupCall.on("mute_state_changed", onParticipantsChanged);
      groupCall.on("participant_call_replaced", onParticipantsChanged);
      groupCall.on("participant_call_feeds_changed", onParticipantsChanged);
      groupCall.on("local_mute_state_changed", onLocalMuteStateChanged);

      updateState({
        loading: false,
      });
    } catch (error) {
      if (groupCallRef.current) {
        const groupCall = groupCallRef.current;
        groupCall.removeListener(
          "active_speaker_changed",
          onParticipantsChanged
        );
        groupCall.removeListener("participants_changed", onParticipantsChanged);
        groupCall.removeListener("speaking", onParticipantsChanged);
        groupCall.removeListener("mute_state_changed", onParticipantsChanged);
        groupCall.removeListener(
          "participant_call_replaced",
          onParticipantsChanged
        );
        groupCall.removeListener(
          "participant_call_feeds_changed",
          onParticipantsChanged
        );
        groupCall.removeListener(
          "local_mute_state_changed",
          onLocalMuteStateChanged
        );
        groupCall.leave();
      }

      updateState({ error, loading: false });
    }

    return () => {
      if (groupCallRef.current) {
        const groupCall = groupCallRef.current;
        groupCall.removeListener(
          "active_speaker_changed",
          onParticipantsChanged
        );
        groupCall.removeListener("participants_changed", onParticipantsChanged);
        groupCall.removeListener("speaking", onParticipantsChanged);
        groupCall.removeListener("mute_state_changed", onParticipantsChanged);
        groupCall.removeListener(
          "participant_call_replaced",
          onParticipantsChanged
        );
        groupCall.removeListener(
          "participant_call_feeds_changed",
          onParticipantsChanged
        );
        groupCall.removeListener(
          "local_mute_state_changed",
          onLocalMuteStateChanged
        );
        groupCall.leave();

        console.log("leave");
      }

      console.log("room changed");
    };
  }, [client, room]);

  usePageUnload(() => {
    if (groupCallRef.current) {
      groupCallRef.current.leave();
    }
  });

  const initLocalParticipant = useCallback(() => {
    if (!groupCallRef.current) {
      return Promise.reject("Group call not initialized.");
    }

    return groupCallRef.current.initLocalParticipant();
  }, []);

  const enter = useCallback(() => {
    if (!groupCallRef.current) {
      return;
    }

    updateState({ entering: true });

    groupCallRef.current
      .enter()
      .then(() => {
        if (!groupCallRef.current) {
          return;
        }

        updateState({
          entered: true,
          entering: false,
          participants: getParticipants(groupCallRef.current),
        });
      })
      .catch((error) => {
        updateState({ error, entering: false });
      });
  }, []);

  const leave = useCallback(() => {
    if (!groupCallRef.current) {
      return;
    }

    groupCallRef.current.leave();

    updateState({
      entered: false,
      participants: [],
      microphoneMuted: false,
      localVideoMuted: false,
    });
  }, []);

  const toggleLocalVideoMuted = useCallback(() => {
    if (!groupCallRef.current) {
      return Promise.reject("Group call not initialized");
    }

    groupCallRef.current.setLocalVideoMuted(
      !groupCallRef.current.isLocalVideoMuted()
    );
  }, []);

  const toggleMicrophoneMuted = useCallback(() => {
    if (!groupCallRef.current) {
      return Promise.reject("Group call not initialized");
    }

    groupCallRef.current.setMicrophoneMuted(
      !groupCallRef.current.isMicrophoneMuted()
    );
  }, []);

  return {
    loading,
    entered,
    entering,
    roomName: room ? room.name : undefined,
    participants,
    groupCall: groupCallRef.current,
    microphoneMuted,
    localVideoMuted,
    error,
    initLocalParticipant,
    enter,
    leave,
    toggleLocalVideoMuted,
    toggleMicrophoneMuted,
  };
}
