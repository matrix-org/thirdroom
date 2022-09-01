import { IconButton } from "../../../atoms/button/IconButton";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import MicIC from "../../../../../res/ic/mic.svg";
import MicOffIC from "../../../../../res/ic/mic-off.svg";
import "./NowPlayingControls.css";
import { usePermissionState } from "../../../hooks/usePermissionState";
import { useMicrophoneState } from "../../../hooks/useMicrophoneState";
import { MicStreamRequest } from "../../components/MicStreamRequest";
import { useHydrogen } from "../../../hooks/useHydrogen";

export function NowPlayingControls() {
  const { platform } = useHydrogen(true);
  const micPermission = usePermissionState("microphone");
  const [microphone, setMicrophone] = useMicrophoneState();

  return (
    <div className="NowPlayingControls shrink-0 flex items-center">
      <MicStreamRequest
        platform={platform}
        permissionState={micPermission}
        render={(requestStream) => (
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
                  const stream = await requestStream();
                  setMicrophone(!!stream);
                  stream?.getAudioTracks().forEach((track) => {
                    track.stop();
                  });
                }
              }}
            />
          </Tooltip>
        )}
      />
    </div>
  );
}
