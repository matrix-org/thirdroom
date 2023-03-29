import { useState } from "react";
import { GroupCall, Stream } from "@thirdroom/hydrogen-view-sdk";

import { usePermissionState } from "../../hooks/usePermissionState";
import { useMicrophoneState } from "../../hooks/useMicrophoneState";
import { useHydrogen } from "../../hooks/useHydrogen";
import { exceptionToString, RequestException, RequestStream, useStreamRequest } from "../../hooks/useStreamRequest";
import { AlertDialog } from "../session/dialogs/AlertDialog";
import { MuteHandler, useCallMute } from "../../hooks/useCallMute";
import { Text } from "../../atoms/text/Text";

export const MicExceptionDialog = ({
  micException,
  setMicException,
}: {
  micException: RequestException | undefined;
  setMicException: (value: undefined | RequestException) => void;
}) => {
  return micException ? (
    <AlertDialog
      open={!!micException}
      title="Microphone"
      content={<Text variant="b2">{exceptionToString(micException)}</Text>}
      requestClose={() => setMicException(undefined)}
    />
  ) : null;
};

export const useMuteButton = (
  activeCall?: GroupCall
): {
  mute: boolean;
  requestStream: RequestStream;
  handleMute: MuteHandler;
  micException: RequestException | undefined;
  setMicException: (value: RequestException | undefined) => void;
} => {
  const { platform } = useHydrogen(true);
  const micPermission = usePermissionState("microphone");
  const requestStream = useStreamRequest(platform, micPermission);
  const [micException, setMicException] = useState<RequestException>();
  const [microphone, setMicrophone] = useMicrophoneState();
  const { mute: callMute, handleMute } = useCallMute(activeCall);
  if (callMute === microphone) {
    setMicrophone(!microphone);
  }

  return { mute: callMute, requestStream, handleMute, micException, setMicException };
};

export const manageMuteRequest = async (
  requestStream: RequestStream,
  setMicException: (value: undefined | RequestException) => void
): Promise<Stream | undefined> => {
  const [stream, exception] = await requestStream(true, false);
  if (stream) return stream;
  setMicException(exception);
  return undefined;
};
