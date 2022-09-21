import { useState } from "react";

import { IconButton } from "../../../atoms/button/IconButton";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import MicIC from "../../../../../res/ic/mic.svg";
import MicOffIC from "../../../../../res/ic/mic-off.svg";
import "./NowPlayingControls.css";
import { usePermissionState } from "../../../hooks/usePermissionState";
import { useMicrophoneState } from "../../../hooks/useMicrophoneState";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { exceptionToString, RequestException, useStreamRequest } from "../../../hooks/useStreamRequest";
import { AlertDialog } from "../dialogs/AlertDialog";
import { Text } from "../../../atoms/text/Text";

export function NowPlayingControls() {
  const { platform } = useHydrogen(true);
  const micPermission = usePermissionState("microphone");
  const requestStream = useStreamRequest(platform, micPermission);
  const [micException, setMicException] = useState<RequestException>();
  const [microphone, setMicrophone] = useMicrophoneState();

  return (
    <div className="NowPlayingControls shrink-0 flex items-center">
      {micException && (
        <AlertDialog
          open={!!micException}
          title="Microphone"
          content={<Text variant="b2">{exceptionToString(micException)}</Text>}
          requestClose={() => setMicException(undefined)}
        />
      )}
      <Tooltip content={microphone ? "Mute" : "Unmute"}>
        <IconButton
          variant="surface-low"
          label="Mic"
          iconSrc={microphone ? MicIC : MicOffIC}
          onClick={async () => {
            if (micPermission == "granted") {
              setMicrophone(!microphone);
            } else if (microphone) {
              setMicrophone(false);
            } else {
              const [stream, exception] = await requestStream(true, false);
              if (exception) setMicException(exception);
              else {
                setMicrophone(!!stream);
                stream?.getAudioTracks().forEach((track) => {
                  track.stop();
                });
              }
            }
          }}
        />
      </Tooltip>
    </div>
  );
}
